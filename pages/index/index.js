const app = getApp()
const CONFIG = app.globalData.config;
const imgUrl = app.globalData.imgUrl;
let timer = ''; // 错误提示计时器
let getPayStatusCount = 0;
const MAX_GET_PAY_STATUS = 10; // 最多尝试10次
let lastCommand = '';

Page({
	data: {
		// userInfo
		// tip
		// btnText
		// playCommand
		// redPackMoney
		// redPackCount
		servicePrice: '0.00',
		imgUrl: imgUrl,
		tabBarList: [{
			iconUrl: `${imgUrl}tab_bar/my_record_icon.png`,
			path: '/pages/record/record',
			text: '我的记录'
		}, {
			iconUrl: `${imgUrl}tab_bar/balance_icon.png`,
			path: '/pages/balance/balance',
			text: '余额提现'
		}, {
			iconUrl: `${imgUrl}tab_bar/problem_icon.png`,
			path: '/pages/question_list/question_list',
			text: '常见问题'
		}],

	},

	onShow: function() {
		if (app.globalData.userInfo) {
			this.setData({
				brandInfo: app.globalData.brandInfo,
				userInfo: app.globalData.userInfo,
				redPackMoney: '',
				redPackCount: ''
			})

			this.loadData();
		} else {
			app.userInfoReadyCallback = (data) => {
				this.setData({
					// 因为用户信息需要brandId数据返回后才能拿到~此处已经拿到了用户信息~所以品牌信息一定已经拿到了
					brandInfo: app.globalData.brandInfo,
					userInfo: data
				});

				this.loadData();
			}
		}
	},

	loadData: function() {

		app.wxRequest({
			interfaceName: CONFIG.interfaceList.GET_USER_PLAY_INFO,
			reqData: {
				userId: this.data.userInfo.user_id,
				brandId: this.data.brandInfo.id
			},
			successCb: (res) => {
				const data = res.data;
				this.setData({
					defaultCommand: data.play_command,
					playCommand: '',
					btnText: '',
					servicePrice: '0.00',
					serviceChargeRate: data.service_charge_rate,
					money: this.getFloatStr(data.money),
				})
				console.log(res);
			}
		})
	},

	isChineseChar: function(str) {
		if (!str) {
			return true;
		}
		var reg = /[\u4E00-\u9FA5\uF900-\uFA2D]/;
		return reg.test(str);
	},

	handleCommandInput: function(e) {
		const cursor = +e.detail.cursor - 1;
		const value = e.detail.value;
		console.log(value.length, value);
		if (!this.isChineseChar(value[cursor])) {
			clearTimeout(timer);
			this.setData({
				tip: '只能输入中文',
				showErr: '1',
				playCommand: this.data.playCommand
			});
			timer = setTimeout(() => {
				this.setData({
					showErr: '0'
				});
			}, 2000);
		} else if (value.length > 20) {
			this.setData({
				tip: '只能输入20个字',
				showErr: '1',
				playCommand: this.data.playCommand
			});
		} else {
			this.setData({
				showErr: '0',
				playCommand: value
			});
		}
	},

	handleRedPackMoney: function(e) {
		const value = e.detail.value;
		
		if (value < 1 || this.data.redPackCount > 0 && value / this.data.redPackCount < 1) {
			console.log(this.testMoneyInput(value))
			this.setData({
				redPackMoney: value,
				servicePrice: this.getFloatStr(this.data.serviceChargeRate * value),
				tip: '每个红包金额不能低于1元',
				showErr: '1'
			});
		} else if (value > 50000) {
			this.setData({
				redPackMoney: this.data.redPackMoney,
				tip: '赏金不能超过50000',
				showErr: '1'
			});
		} else {
			this.setData({
				redPackMoney: this.testMoneyInput(value),
				servicePrice: this.getFloatStr((1000 * this.data.serviceChargeRate) * (1000 * value) / 1000000),
				// servicePrice: this.getFloatStr(((100 * this.data.serviceChargeRate) * (value * 100)) / 10000),
				showErr: '0'
			});
		}
		
		console.log(((this.data.servicePrice * 100) + (this.data.redPackMoney * 100) - (this.data.money * 100)) / 100);
		if ( ((this.data.servicePrice * 100) + (this.data.redPackMoney * 100) - (this.data.money * 100)) / 100 > 0 ) {
			this.setData({
				btnText: `还需支付${this.getFloatStr(((this.data.servicePrice * 100) + (this.data.redPackMoney * 100) - (this.data.money * 100)) / 100)}元`
			})
		} else {
			this.setData({
				btnText: ''
			})
		}
	},

	handleRedPackCount: function(e) {
		const value = e.detail.value;
		if (this.data.redPackMoney > 0 && this.data.redPackMoney / value < 1) {
			this.setData({
				redPackCount: value,
				tip: '每个红包金额不能低于1元',
				showErr: '1'
			});
		} else if (value > 10000) {
			this.setData({
				redPackCount: this.data.redPackCount,
				tip: '红包数量不能超过10000',
				showErr: '1'
			});
		} else {
			this.setData({
				redPackCount: value,
				showErr: '0'
			});
		}
	},

	createCommand: function() {
		if (!this.data.redPackMoney) {
			this.setData({
				tip: '赏金不能为空',
				showErr: '1'
			});
			return
		} else if (!this.data.redPackCount) {
			this.setData({
				tip: '红包数不能为空',
				showErr: '1'
			});
			return;
		} else if (this.data.showErr === '1') {
			return;
		}
		app.wxRequest({
			interfaceName: CONFIG.interfaceList.CREATE_REDPACKET,
			bodyData: {
				userId: this.data.userInfo.user_id,
				content: this.data.playCommand || this.data.defaultCommand,
				count: this.data.redPackCount,
				money: this.data.redPackMoney,
				brandId: this.data.brandInfo.id
			},
			successCb: (res) => {
				const command = this.data.playCommand || this.data.defaultCommand;
				if (res.data.need_pay <= 0) {
					wx.navigateTo({
						url: `/pages/share/share?command=${encodeURI(command).toLowerCase()}&redpacket_send_id=${res.data.redpacket_send_id}`
					});
				} else {
					this.toPay(res.data);
				}
				console.log(res);
			},
			extendsOptions: {
				method: "POST"
			}
		})
	},

	toPay: function(payInfo) {
		const that = this;
		console.log(payInfo);
		wx.requestPayment({
			'package': payInfo.package,
			'nonceStr': payInfo.nonce_str,
			'timeStamp': payInfo.time_stamp,
			'paySign': payInfo.pay_sign,
			'signType': payInfo.sign_type,
			'success': function(res) {
				lastCommand = that.data.playCommand;
				setTimeout(() => {
					that.getPayStatus(payInfo.redpacket_send_id);
				}, 1000);
			},
			'fail': function(res) {

				app.wxRequest({
					interfaceName: CONFIG.interfaceList.CANCEL_REDPACKET_ACTIVITY,
					reqData: {
						redpacketSendId: payInfo.redpacket_send_id
					},
					successCb: (res) => {
						setTimeout(() => {
							wx.showToast({
								title: '支付失败',
								image: '/images/common/err_tip_icon.png',
								duration: 2000
							});
						}, 320);
					},
					extendsOptions: {
						method: "POST"
					}
				})
			},
		})
	},

	// 递归~每隔3秒调用一次接口获取支付状态~当支付状态为真时~才表示已经真正支付完毕~页面跳转到分享页面
	getPayStatus: function (redpacketSendId) {
		console.log('调用了递归接口');
		app.wxRequest({
			interfaceName: CONFIG.interfaceList.GET_REDPACKET_ACTIVITY_STATUS,
			reqData: {
				redpacketSendId: redpacketSendId
			},
			successCb: (res) => {
				if (res.data) {
					console.log(this.data);
					wx.navigateTo({
						url: `/pages/share/share?command=${encodeURI(lastCommand).toLowerCase()}&redpacket_send_id=${redpacketSendId}`
					});
				} else {
					getPayStatusCount = getPayStatusCount + 1;
					if (getPayStatusCount > MAX_GET_PAY_STATUS) {
						wx.showToast({
							title: '生成口令失败',
							image: '/images/common/err_tip_icon.png',
							duration: 2000
						})
						return;
					} else {
						setTimeout(() => {
							this.getPayStatus(redpacketSendId);
						}, 3000);
					}

				}
				console.log(res, '-----递归接口返回值');
			}
		})
	},

	// 将数字转换为小数点后两位
	getFloatStr: function(num) {
		num += '';
		num = num.replace(/[^0-9|\.]/g, ''); //清除字符串中的非数字非.字符

		if (/^0+/) { //清除字符串开头的0
			num = num.replace(/^0+/, '');
		}

		if (!/\./.test(num)) { //为整数字符串在末尾添加.00
			num += '.00';
		}

		if (/^\./.test(num)) { //字符以.开头时,在开头添加0
			num = '0' + num;
		}

		num += '00'; //在字符串末尾补零
		num = num.match(/\d+\.\d{2}/)[0];
		return num;
	},

	// 限制用户输入小数点后很多位
	testMoneyInput: function(value) {
		const int = value.split('.')[0];
		const dig = value.split('.')[1];
		if (dig && dig.length > 2) {
			return int + '.' + dig.slice(0, 2)
		} else {
			return value
		}
	}
})