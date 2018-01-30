const app = getApp();
const CONFIG = app.globalData.config;
const queryHelper = require('../../utils/request_helper/request_helper.js');

Page({

	data: {
		// canvasWidth
		// canvasHeight
		// qrCode
		// doubleLine
		// rewardDesc
		// brandName
		// brandLogo
		imgUrl: app.globalData.imgUrl,
	},

	onLoad: function(options) {
		console.log(options);
		if (!app.globalData.userInfo) {
			wx.navigateTo({
				url: '/pages/index/index'
			})
			return;
		}
		this.setData({
			brandName: app.globalData.brandInfo.brand_name,
			// brandLogo: app.globalData.brandInfo.brand_main_logo || '/images/temp_logo.png',
			redpackageSendId: options.redpacket_send_id,
			userId: app.globalData.userInfo.user_id
		});

		this.loadData();
	},

	onShow: function() {
		// setTimeout模拟接口延时~待数据返回后需根据优惠券文字~判断是一行还是两行~对应设置canvas高度
		setTimeout(() => {
			// this.init();
		}, 1000);
	},

	loadData: function () {
		app.wxRequest({
			interfaceName: CONFIG.interfaceList.GET_REDPACKETrECEIVE_LIST,
			reqData: {
				redpackageSendId: this.data.redpackageSendId,
				userId: this.data.userId
			},
			successCb: (res) => {
				const { user_reward } = { ...res.data };
				console.log(user_reward);
				const qrArg = queryHelper.queryEncoded({
					'link': user_reward.reward_voucher
				});
				const brandLogoArg = queryHelper.queryEncoded({
					'link': app.globalData.brandInfo.brand_main_logo
				});
				const qrCode = `${CONFIG.interfaceDomin}${CONFIG.interfaceList.PROXY_GET}/${qrArg}`;
				const brandLogo = `${CONFIG.interfaceDomin}${CONFIG.interfaceList.PROXY_GET}/${brandLogoArg}`;

				this.setData({
					qrCode: qrCode,
					brandLogo: brandLogo,
					rewardDesc: user_reward.reward_desc,
					rewardName: user_reward.reward_name
				});

				this.init();

				console.log(this.data);
			}
		})
	},

	init: function () {
		const that = this;
		wx.createSelectorQuery().select('#qrCanvas').boundingClientRect(function (rect) {
			that.setData({
				canvasWidth: rect.width,
				canvasHeight: rect.height
			})
			that.drawImage();
		}).exec();
	},

	drawImage: function() {
		const that = this;
		console.log(that.data.qrCode);
		wx.downloadFile({
			url: that.data.qrCode,
			success(down_res) {
				console.log(down_res);
				const canvasWidth = that.data.canvasWidth;
				const canvasHeight = that.data.canvasHeight;

				const rewardDesc = that.data.rewardDesc;
				const brandName = that.data.brandName;

				const qrBoxWidth = Math.floor(0.42 * canvasWidth);
				const qrBoxX = Math.floor((canvasWidth - qrBoxWidth) / 2);
				const qrBoxY = rewardDesc.length > 12 ? canvasHeight * 0.62 : canvasHeight * 0.54;

				const logoWidth = Math.floor(0.18 * canvasWidth);
				const logoX = Math.floor(canvasWidth / 2); // 绘制圆形头像区域的圆点x
				const logoY = Math.floor(canvasHeight * 0.249); // 绘制圆形头像区域的圆点y


				const qrCodeFilePath = down_res.tempFilePath;
				const ctx = wx.createCanvasContext('qrCodeCanvas');

				const rewardDescY = 0.49 * canvasHeight;

				ctx.drawImage('/images/other/red_package_bg.png', 0, 0, that.data.canvasWidth, that.data.canvasHeight);
				console.log(qrCodeFilePath);
				ctx.drawImage(qrCodeFilePath, qrBoxX, qrBoxY, qrBoxWidth, qrBoxWidth);

				that.writeText(ctx, brandName, canvasWidth / 2, 0.38 * canvasHeight, 14);
				const rewardDescArr = rewardDesc.length > 12 ? [rewardDesc.slice(0, 12), rewardDesc.slice(12)] : [rewardDesc];
				rewardDescArr.forEach((item, index) => {
					that.writeText(ctx, item, canvasWidth / 2, rewardDescY + index * 36, 30);
				});
				
				wx.downloadFile({
					url: that.data.brandLogo,
					success(down_res) {
						console.log(down_res);
						const logoFilePath = down_res.tempFilePath;
						that.drawLogo(ctx, logoFilePath, logoX, logoY, logoWidth / 2);
						ctx.draw();
					}
				})
			}
		})
	},

	writeText: function(ctx, text, x, y, fontSize) {
		ctx.setTextAlign('center');
		ctx.setFillStyle('#333333');
		ctx.setFontSize(fontSize || 14);
		ctx.fillText(text, x, y)
	},

	drawLogo: function(ctx, logoFilePath, x, y, r) {
		ctx.save(); // 保存当前ctx的状态
		ctx.arc(x, y, r, 0, 2 * Math.PI);
		ctx.clip(); //裁剪上面的圆形
		ctx.drawImage(logoFilePath, x - r, y - r, 2 * r, 2 * r); // 在刚刚裁剪的园上画图
		ctx.restore();
	},

	saveImage: function() {
		wx.canvasToTempFilePath({
			canvasId: 'qrCodeCanvas',
			success: function(res) {
				const filePath = res.tempFilePath;
				console.log(filePath);

				wx.saveImageToPhotosAlbum({
					filePath: filePath,
					success(res) {
						try {
							wx.showToast({
								title: '图片保存成功',
							});
						} catch (e) {
							console.log(e);
						}

					},
					fail(res) {
						wx.showToast({
							"title": '保存失败'
						})
					}
				})
			}
		})
	}
})