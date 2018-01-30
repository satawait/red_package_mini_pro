const app = getApp();
const CONFIG = app.globalData.config;

Page({
	
	data: {
		// userId
		// balance
		// balanceValue
	},
	
	onLoad: function (options) {
		if(!app.globalData.userInfo) {
			wx.navigateTo({
				url: '/pages/index/index'
			})
			return;
		} else {
			this.setData({
				userId: app.globalData.userInfo.user_id
			});

			this.loadData();
		}
	},
	
	onShow: function () {

	},

	loadData: function() {
		app.wxRequest({
			interfaceName: CONFIG.interfaceList.GET_USER_ASSETS,
			reqData: {
				userId: this.data.userId
			},
			successCb: (res) => {
				this.setData({
					balance: this.getFloatStr(res.data)
				});
				console.log(res);
			}
		})
	},

	handleAll: function() {
		this.setData({
			balanceValue: this.data.balance
		});
	},

	handleInput: function(e) {
		const value = e.detail.value;

		this.setData({
			showErr: (+value > +this.data.balance) || (+value < 1) ? '1' : '0',
			tip: (+value > +this.data.balance) ? '提现金额超过账户余额' : (value !== '' && +value < 1) ? '提现金额不能少于1元' : '提现金额不能为空',
			balanceValue: value
		});
	},

	getCash: function() {
		if (!this.data.balanceValue || this.data.balanceValue.trim() === '') {
			this.setData({
				showErr: '1',
				tip: '提现金额不能为空'
			});
			return;
		}
		app.wxRequest({
			interfaceName: CONFIG.interfaceList.APPLY_WITH_DRAW_CASH,
			reqData: {
				userId: this.data.userId,
				money: this.data.balanceValue
			},
			successCb: (res) => {
				const that = this;
				wx.showModal({
					title: '提示',
					content: '提现成功，预计1-5个工作日内到账',
					showCancel: false,
					success: function (res) {
						if (res.confirm) {
							that.setData({
								balanceValue: ''
							});
							that.loadData();
						}
					}
				})
			},
			extendsOptions: {
				method: "POST"
			}
		})
	},

	// 将数字转换为小数点后两位
	getFloatStr: function (num) {
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
})