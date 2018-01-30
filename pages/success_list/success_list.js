const app = getApp()
const CONFIG = app.globalData.config;
const recorderManager = wx.getRecorderManager();
const innerAudioContext = wx.createInnerAudioContext();
const queryHelper = require('../../utils/request_helper/request_helper.js');
let startTime = 0;

Page({
	data: {
		// userInfo
		// logoWidth
		// showVoice
		// redpacketSendId
		// userInfo
		// brandInfo
		// shareUrl
		// playingIndex
		// hasDone // 判断赏金是否已经被领完
		imgUrl: app.globalData.imgUrl,

	},

	onLoad: function(options) {
		console.log(options, '------------------success list options');

		if (app.globalData.userInfo) {
			this.setData({
				redpacketSendId: options.redpacket_send_id || '1085',
				brandInfo: app.globalData.brandInfo,
				userInfo: app.globalData.userInfo
			})
			this.init();
		} else {
			app.userInfoReadyCallback = data => {
				this.setData({
					redpacketSendId: options.redpacket_send_id || '1071',
					// 因为用户信息需要brandId数据返回后才能拿到~此处已经拿到了用户信息~所以品牌信息一定已经拿到了
					brandInfo: app.globalData.brandInfo,
					userInfo: data
				});
				this.init();
			}
		}
	},

	init: function() {
		this.initLogo();
		this.loadData();
		this.authInit();
	},

	// 提前授权录音
	authInit: function() {
		recorderManager.start();
		setTimeout(() => {
			recorderManager.stop();
		}, 100);
	},

	loadData: function() {
		app.wxRequest({
			interfaceName: CONFIG.interfaceList.GET_REDPACKETrECEIVE_LIST,
			reqData: {
				redpackageSendId: this.data.redpacketSendId,
				userId: this.data.userInfo.user_id
			},
			successCb: (res) => {
				res.data.received_list = this.handleData(res.data.received_list);
				const redpacketSendId = this.data.redpacketSendId;
				const command = encodeURI(res.data.play_command).toLowerCase();
				this.setData({
					...res.data,
					money: this.getFloatStr(res.data.money),
					user_money: this.getFloatStr(res.data.user_money),
					shareUrl: `/pages/share/share?command=${command}&redpacket_send_id=${redpacketSendId}`,
					hasDone: (+res.data.received_count >= +res.data.total_count) ? '0' : '0'
				});
			}
		})
	},

	handleData: function(list) {
		list.forEach((item) => {
			item.money = this.getFloatStr(item.money);
		});

		return list;
	},

	initLogo: function() {
		const that = this;
		wx.createSelectorQuery().in(this).select('.logo').boundingClientRect(function(rect) {
			if (rect) {
				that.setData({
					logoHeight: rect.bottom - rect.top
				})
				console.log(`${that.data.imgUrl}temp_logo.png`);
				wx.getImageInfo({
					src: `${that.data.imgUrl}temp_logo.png`,
					success: (res) => {
						console.log(that.data.logoHeight);
						that.setData({
							logoWidth: res.width * (that.data.logoHeight / res.height)
						})
					}
				})
			}
		}).exec();
	},

	playAudio: function(e) {
		const index = e.currentTarget.dataset.index;
		const audioUrl = this.data.received_list[index].audio_url;

		innerAudioContext.src = audioUrl;
		innerAudioContext.play();

		innerAudioContext.onPlay(() => {
			this.setData({
				playingIndex: index
			});
			console.log('开始播放')
		})

		innerAudioContext.onEnded(() => {
			this.setData({
				playingIndex: -1
			});
		})

		innerAudioContext.onError(() => {
			this.setData({
				playingIndex: -1
			});
		})

	},

	beginRecord: function() {
		startTime = new Date().getTime();
		this.setData({
			showVoice: true
		});
		this.start();
	},

	endRecord: function() {
		const duration = (new Date().getTime() - startTime) / 1000;

		if (duration < 1) {
			wx.showToast({
				title: '录音时间太短',
				image: '/images/common/err_tip_icon.png',
				duration: 1500
			})
		}

		this.setData({
			showVoice: false
		});
		this.stop();
	},

	start: function() {
		const options = {
			duration: 10000, //指定录音的时长，单位 ms
			sampleRate: 16000, //采样率
			numberOfChannels: 1, //录音通道数
			encodeBitRate: 96000, //编码码率
			format: 'mp3', //音频格式，有效值 aac/mp3
			frameSize: 50, //指定帧大小，单位 KB
		}
		//开始录音
		recorderManager.start(options);
		recorderManager.onStart(() => {
			console.log('recorder start')
		});
		//错误回调
		recorderManager.onError((res) => {
			console.log(res);
		})
	},

	stop: function() {
		recorderManager.stop();
		recorderManager.onStop((res) => {
			this.setData({
				voiceFilePath: res.tempFilePath
			})

			this.upload();

		})
	},

	upload: function() {
		wx.showLoading({
			title: '识别中...',
		});
		const req = queryHelper.queryEncoded({
			'redpacketSendId': this.data.redpacketSendId,
			'userId': this.data.userInfo.user_id,
			'brandId': this.data.brandInfo.id
		});

		console.log(req);

		wx.uploadFile({
			url: `${CONFIG.interfaceDomin}${CONFIG.interfaceList.UPLOAD_VOICE}/${req}`,
			filePath: this.data.voiceFilePath,
			name: 'file',
			formData: {
				'msg': 'voice'
			},
			success: (res) => {
				wx.hideLoading();
				const data = JSON.parse(res.data);
				console.log(data.code);
				if (data.code !== '1') {
					wx.showToast({
						title: '识别错误',
						image: '/images/common/recognition_err.png',
						duration: 1500
					})
				} else {
					wx.showToast({
						title: '识别成功',
						image: '/images/common/recognition_success.png',
						duration: 1500
					})

					this.setData({
						rewardId: data.data.reward_id
					});

					app.globalData.rewardName = data.reward_name;
					app.globalData.rewardDesc = data.reward_desc;
					app.globalData.rewardVoucher = data.reward_voucher;

					this.loadData();
				}
			}
		})
	},

	play: function() {
		innerAudioContext.autoplay = true
		innerAudioContext.src = 'http://ws.stream.qqmusic.qq.com/M500001VfvsJ21xFqb.mp3?guid=ffffffff82def4af4b12b3cd9337d5e7&uin=346897220&vkey=6292F51E1E384E06DCBDC9AB7C49FD713D632D313AC4858BACB8DDD29067D3C601481D36E62053BF8DFEAF74C0A5CCFADD6471160CAF3E6A&fromtag=46',
			innerAudioContext.onPlay(() => {
				console.log('开始播放')
			})
		innerAudioContext.onError((res) => {
			console.log(res.errMsg)
			console.log(res.errCode)
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
})