const app = getApp();
const CONFIG = app.globalData.config;
const queryHelper = require('../../utils/request_helper/request_helper.js');
const Base64 = require('../../utils/encode_helper/base64.js');

Page({

	data: {
		// canvasWidth
		// canvasHeight
		// miniProCode
		// commandText
		// brandLogo
		// userImg
		// brandInfo
		imgUrl: app.globalData.imgUrl
	},

	onLoad: function(options) {

		this.setData({
			// 拆红包的用户从拆红包页面点击转发好友进到此页~会在app.globalData.portraitPath中记录发出红包的用户的头像
			// 如果没有~则说明是生成口令后进到此分享页面的~当前用户就是发出红包的用户~直接使用用户头像
			userImg: app.globalData.portraitPath || app.globalData.userInfo.avatarUrl,
			userInfo: app.globalData.userInfo,
			fromSuccessList: options.from_success_list
		});

		const commandText = decodeURI(options.command);
		const redpacketSendId = decodeURI(options.redpacket_send_id);

		this.setData({
			brandInfo: app.globalData.brandInfo,
			commandText: commandText,
			redpacketSendId: redpacketSendId
		});
		const pathArg = Base64.encode(`pages/success_list/success_list`);
		const widthArg = Base64.encode('300');
		const sceneArg = Base64.encode('temp.jpg');
		const thumbArg = queryHelper.queryEncoded({
			'link': this.data.userImg
		});

		const brandLogoArg = queryHelper.queryEncoded({
			'link': app.globalData.brandInfo.brand_big_dark_logo
		});

		const miniProCode = `${CONFIG.interfaceDomin}${CONFIG.interfaceList.CREATE_MINI_PRO_CODE}/${pathArg}&${widthArg}&${sceneArg}`;
		console.log(miniProCode);
		const thumb = `${CONFIG.interfaceDomin}${CONFIG.interfaceList.PROXY_GET}/${thumbArg}`;
		const brandLogo = `${CONFIG.interfaceDomin}${CONFIG.interfaceList.PROXY_GET}/${brandLogoArg}`;

		this.setData({
			miniProCode: miniProCode,
			thumb: thumb,
			brandLogo: brandLogo,
			brandCode: app.globalData.brandCode
		});

		const that = this;
		wx.createSelectorQuery().select('#miniProCodeCanvasHide').boundingClientRect(function(rect) {
			that.setData({
				canvasWidth: rect.width,
				canvasHeight: rect.height
			})
			that.initLogo();
		}).exec();
	},

	onShareAppMessage: function(res) {
		return {
			title: '福福福福利利利利',
			path: '/pages/success_list/success_list?redpacket_send_id=' + this.data.redpacketSendId + '&brand_code=inno'
			// path: '/pages/success_list/success_list?redpacket_send_id=' + this.data.redpacketSendId + '&brand_code=' + this.data.brandCode
		}
	},

	initLogo: function(cb) {
		const that = this;
		wx.createSelectorQuery().in(this).select('.brand_logo').boundingClientRect(function(rect) {
			if (rect) {
				that.setData({
					brandLogoHeight: rect.bottom - rect.top
				})

				wx.getImageInfo({
					src: that.data.brandInfo.brand_big_dark_logo,
					success: (res) => {
						that.setData({
							brandLogoWidth: res.width * (that.data.brandLogoHeight / res.height)
						})

						that.drawImage('miniProCodeCanvasHide', '/images/share/share_bg.jpg', () => {
							that.setData({
								isCanvasReady: true
							});
							typeof that.canvasReadyCb === 'function' && that.canvasReadyCb();
						})
					}
				})
			}
		}).exec();
	},

	drawImage: function(canvasSelect, bgUrl, cb) {
		const that = this;
		wx.downloadFile({
			url: this.data.miniProCode,
			success(down_res) {
				const canvasWidth = that.data.canvasWidth;
				const canvasHeight = that.data.canvasHeight;
				const bgHeight = that.data.canvasHeight;

				const avatarWidth = Math.floor(0.18 * canvasWidth);
				const avatarX = Math.floor(canvasWidth / 2); // 绘制圆形头像区域的圆点x
				const avatarY = Math.floor(canvasHeight * 0.036 + avatarWidth / 2); // 绘制圆形头像区域的圆点y

				const brandLogoX = (canvasWidth - that.data.brandLogoWidth) / 2;
				const brandLogoY = canvasHeight * 0.72;

				const miniProCodeWidth = Math.floor(0.28 * canvasWidth);
				const miniProCodeX = Math.floor(canvasWidth / 2);
				const miniProCodeY = Math.floor(canvasHeight * 0.56);

				const coreWidth = Math.floor(0.108 * canvasWidth);

				const commandText = that.data.commandText;
				const commandTextArr = commandText.length > 12 ? [commandText.slice(0, 12), commandText.slice(12)] : [commandText];
				const textY = commandText.length > 12 ? 0.32 * canvasHeight : 0.36 * canvasHeight;

				const miniProCodeFilePath = down_res.tempFilePath;
				const ctx = wx.createCanvasContext(canvasSelect);

				ctx.drawImage(bgUrl, 0, 0, canvasWidth, bgHeight);
				commandTextArr.forEach((item, index) => {
					that.writeText(ctx, item, 24, '#fbe194', canvasWidth / 2, textY + 34 * index);
				});

				that.drawMiniProCode(ctx, miniProCodeFilePath, miniProCodeX, miniProCodeY, miniProCodeWidth / 2, {
					lineWidth: 6,
					borderColor: '#bb2b2a'
				});

				that.drawCircle(ctx, '/images/share/core_icon.png', miniProCodeX, miniProCodeY, coreWidth / 2);

				wx.downloadFile({
					url: that.data.thumb,
					success(down_res) {
						const thumbFilePath = down_res.tempFilePath;
						that.drawCircle(ctx, thumbFilePath, avatarX, avatarY, avatarWidth / 2, {
							lineWidth: 3,
							borderColor: '#d87348'
						});
						wx.downloadFile({
							url: that.data.brandLogo,
							success(down_res) {
								const brandLogoFilePath = down_res.tempFilePath;
								ctx.drawImage(brandLogoFilePath, brandLogoX, brandLogoY, that.data.brandLogoWidth, that.data.brandLogoHeight);
								ctx.draw(false, () => {
									typeof cb === 'function' && cb();
								});
							}
						})
					}
				})
			}
		})
	},

	writeText: function(ctx, text, fontSize, color, x, y) {
		ctx.setTextAlign('center');
		ctx.setFontSize(fontSize || 26);
		ctx.setFillStyle(color || '#333333');
		ctx.fillText(text, x, y)
	},

	drawCircle: function(ctx, thumbTempFilePath, x, y, r, borderStyle) {

		ctx.save(); // 保存当前ctx的状态
		ctx.arc(x, y, r, 0, 2 * Math.PI);
		ctx.clip(); //裁剪上面的圆形
		ctx.drawImage(thumbTempFilePath, x - r, y - r, 2 * r, 2 * r); // 在刚刚裁剪的园上画图
		ctx.restore();

		ctx.beginPath();
		ctx.arc(x, y, r, 0, 2 * Math.PI);
		if (borderStyle) {
			ctx.setLineWidth(borderStyle.lineWidth);
			ctx.setStrokeStyle(borderStyle.borderColor);
		}

		ctx.stroke();
	},

	drawMiniProCode: function(ctx, thumbTempFilePath, x, y, r, borderStyle) {
		const radii = (borderStyle ? +borderStyle.lineWidth || 0 : 0) + r;

		ctx.save(); // 保存当前ctx的状态
		ctx.arc(x, y, radii, 0, 2 * Math.PI);
		ctx.setFillStyle('#FFFFFF');
		ctx.fill()
		ctx.clip(); //裁剪上面的圆形
		ctx.drawImage(thumbTempFilePath, x - r, y - r, 2 * r, 2 * r); // 在刚刚裁剪的园上画图
		ctx.restore();

		ctx.beginPath();
		ctx.arc(x, y, radii, 0, 2 * Math.PI);
		if (borderStyle) {
			ctx.setLineWidth(borderStyle.lineWidth);
			ctx.setStrokeStyle(borderStyle.borderColor);
		}

		ctx.stroke();
	},

	handleShowBigImg: function(e) {
		if (!this.data.isCanvasReady) {
			wx.showLoading({
				title: '图片生成中'
			});
			this.canvasReadyCb = () => {
				wx.hideLoading();
				wx.canvasToTempFilePath({
					canvasId: 'miniProCodeCanvasHide',
					success: function(res) {
						const filePath = res.tempFilePath;
						wx.previewImage({
							current: filePath, // 当前显示图片的http链接
							urls: [filePath] // 需要预览的图片http链接列表
						})
					}
				})
			}
		} else {
			wx.canvasToTempFilePath({
				canvasId: 'miniProCodeCanvasHide',
				success: function(res) {
					const filePath = res.tempFilePath;
					wx.previewImage({
						current: filePath, // 当前显示图片的http链接
						urls: [filePath] // 需要预览的图片http链接列表
					})
				}
			})
		}
	},

	handleBack: function() {
		wx.navigateBack();
	}
})