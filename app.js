const CONFIG = require('./base_config.js').config;
const queryHelper = require('./utils/request_helper/request_helper.js');

App({

    // 定义一下当前类需要用到的变量
    appData: {
        // code
    },

    globalData: {
        // globalData
        // userInfo
        imgUrl: CONFIG.imgUrl,
        config: CONFIG,
    },

    onLaunch: function (options) {
		// console.log(options, '------------初始化链接参数')
		// this.handleBrandCode(options, this.handleUserInfo);
        // this.handleCookieId();
    },

	onShow: function (options) {
		this.globalData.userInfo = null;
		console.log(options, '-------11-----初始化链接参数')
		this.handleBrandCode(options, this.handleUserInfo);
		this.handleCookieId();
	},

	handleBrandCode: function (options, cb) {
		console.log(this.globalData.brandInfo);
		// 缓存和进入页面的路径都没有brandCode时默认用test方便开发测试~实际上线时一定会带上参数
		this.globalData.brandCode = options.query.brand_code || wx.getStorageSync('BRAND_CODE') || ' ';
		console.log(this.globalData.brandCode, '-----------handleBrandCode中拿到的brandCode-------', options.query.brand_code);
		try {
			const storageBrandCode = wx.getStorageSync('BRAND_CODE');
			console.log(storageBrandCode, '---------------缓存中的brandCode');
			if (storageBrandCode && this.globalData.brandCode === storageBrandCode) {
				this.globalData.brandInfo = wx.getStorageSync('BRAND_INFO');
				console.log('缓存中存在brandCode并且和链接中拿到的brandCode一样');
				cb(this);
			} else {
				this.getBrandInfo(cb);
			}
		} catch (e) {}
	},

	getBrandInfo: function (cb) {
		const that = this;
		this.wxRequest({
			interfaceName: CONFIG.interfaceList.GET_BRAND_INFO,
			reqData: {
				brandCode: this.globalData.brandCode
			},
			successCb: (res) => {
				if (this.brandInfoReadyCallback) {
					this.brandInfoReadyCallback(res);
				}
				console.log(res.data, '-----------------通过接口拿到的brandInfo');
				this.globalData.brandInfo = res.data; 
				this.globalData.brandCode = res.data.brand_code;
				wx.setStorage({
					key: 'BRAND_CODE',
					data: this.globalData.brandCode
				});

				wx.setStorage({
					key: 'BRAND_INFO',
					data: this.globalData.brandInfo,
					success: function() {
						cb(that);
					}
				})
			}
		})
	},

    handleCookieId: function () {
        try {
            let systemInfoArr = wx.getSystemInfoSync().system.split(' ');
            this.appData.sysType = systemInfoArr[0].toUpperCase();
            this.appData.sysVersion = systemInfoArr[1];
            let cookieId = wx.getStorageSync('cookie_id');
            if (!cookieId) {
                cookieId = new Date().getTime();
                wx.setStorageSync('cookie_id', cookieId);
            }
            this.appData.cookieId = cookieId;
            this.globalData.cookieId = cookieId;

        } catch (e) { }
    },

	// 获取用户信息处理函数~因为接口中需要用到brandId参数~所以需要被放在brandInfo数据接口的成功的回调中执行
    handleUserInfo: function (context) {
        try {
            const userInfo = wx.getStorageSync('USER_INFO');
			console.log(userInfo);
            if (userInfo) {
                context.globalData.userInfo = userInfo;
				
				if (context.userInfoReadyCallback) {
					console.log(112233);
					context.userInfoReadyCallback(userInfo)
				}
				context.culateLoginLog();
            } else {
                // 登录
                wx.login({
                    success: res => {
                        context.appData.code = res.code;
                        // 获取用户信息
                        wx.getSetting({
                            success: res => {
                                context.getUserInfo();
                            }
                        })
                    }
                })
            }
        } catch (e) { }
    },

	culateLoginLog: function() {
		this.wxRequest({
			interfaceName: CONFIG.interfaceList.CREATE_USER_VISIT_LOG,
			reqData: {
				userId: this.globalData.userInfo.user_id,
				brandId: this.globalData.brandInfo.id
			},
			successCb: (res) => {}
		})
	},

    getUserInfo: function () {
        console.log('调用了请求用户信息接口');
        wx.getUserInfo({
            success: res => {
                res.userInfo.code = this.appData.code;
                let userInfo = res.userInfo;

				const bodyData = {
					encryptedData: res.encryptedData,
					iv: res.iv,
					code: this.appData.code
				};

				this.wxRequest({
					interfaceName: CONFIG.interfaceList.LOGIN,
					reqData: {
						brandId: this.globalData.brandInfo.id
					},
					bodyData: bodyData,
					successCb: (res) => {
						userInfo = {
							...userInfo,
							...res.data
						};
						
						this.globalData.userInfo = userInfo;
						wx.setStorage({
							key: 'USER_INFO',
							data: userInfo
						});
						
						// 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
						// 所以此处加入 callback 以防止这种情况（其实就是确保异步返回的用户信息数据可以渲染到页面上）
						
						if (this.userInfoReadyCallback) {
							this.userInfoReadyCallback(userInfo)
						}
						
						this.culateLoginLog();
					},
					extendsOptions: {
						method: 'POST'
					}
				})

            },
            fail: res => {
                wx.openSetting({
                    success: (res) => {
                        this.getUserInfo();
                    },
                    fail: (res) => {
                        console.log(res);
                    }
                })
            }
        })
    },

    // 数据请求函数
    wxRequest: function ({
		interfaceName,
        reqData,
        bodyData,
        successCb,
        failCb = (res) => {
            console.log('请求失败~具体信息为：', res);
            wx.showToast({
                title: res.msg.length > 7 ? '接口请求错误' : res.msg,
                image: '/images/common/err_tip_icon.png',
                duration: 2000
            })
        },
        isShowLoad = 1,
        extendsOptions = {}
	}) {

        if (isShowLoad === 1) {
            wx.showLoading({
                title: '加载中...',
            });
        }

        // 根据域名,接口名和请求参数组成最后的请求url
        // domin + interfaceName + queryHelper.queryEncoded(reqData)
        // 如果而外配置中传入noHeaderArg表示此次请求的请求参数要放到请求体中而不是url中~故无需编码拼接
        const domin = CONFIG.interfaceDomin;
        const reqUrl = reqData ?
            `${domin}${interfaceName}/${queryHelper.queryEncoded(reqData)}` :
            `${domin}${interfaceName}`;

        console.log('请求信息：', reqUrl, reqData);

        wx.request({
            url: reqUrl,
            data: bodyData || '',
            method: extendsOptions.method || CONFIG.reqMethod,
            header: {
                ...CONFIG.header,
                sys_type: this.appData.sysType,
                sys_version: this.appData.sysVersion,
                cookie_id: this.appData.cookieId
            },
            success: function (res) {
                wx.hideLoading();
                if (res.data.code === '1') {
                    typeof successCb == "function" && successCb(res.data);
                } else {
                    failCb(res.data);
                }

            },
            fail: function (res) {
                wx.hideLoading();
                failCb(res.data);
            }
        })
    },

})