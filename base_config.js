const config = {
	// "interfaceDomin": "https://miniptapi.innourl.com/Redpacket/", // 测试环境接口域名
	"interfaceDomin": "https://rpapi.innourl.com/", // 正式环境接口域名
	// "imgUrl": "http://10.1.1.5:8092/images/red_package_min_pro/", // 测试环境图片地址
	// "imgUrl": "http://inno.mo2o.com.cn:8092/images/red_package_min_pro/", // 测试环境图片地址
	"imgUrl": "http://rpfile.innourl.com/AppRes/red_package_min_pro/", // 正式环境图片地址
	"pageSize": 20,
	"reqMethod": "GET",
	"header": {
		'content-type': 'application/json'
	},
	"interfaceList": {
		/**
		 * 根据brand_code获取品牌信息
		 * {brandCode}
		 */
		"GET_BRAND_INFO": "Brand/GetBrandInfo",
		/**
		 * 登陆注册
		 * {brandId}
		 */
		"LOGIN": "User/Login",
		/**
		 * 代理到合法域名下接口
		 * {url}
		 */
		"PROXY_GET": "Proxy/Get",
		/**
		 * 根据用户获取发送的红包列表
		 * {userId}&{pageIndex}&{pageSize}
		 */
		"GET_SEND_RED_PACKAGE": "Redpacket/GetSendRedpacketListByUserId",
		/**
		 * 根据用户获取收到的红包列表
		 * {userId}&{pageIndex}&{pageSize}
		 */
		"GET_RECEIVED_RED_PACKAGE": "Redpacket/GetReceivedRedpacketListByUserId",
		/**
		 * 获取指定红包的领取情况
		 * {redpackageSendId}&{userId}
		 */
		"GET_REDPACKETrECEIVE_LIST": "Redpacket/GetRedpacketReceivedListById",
		/**
		 * 获取用户创建红包所需的信息
		 * {userId}&{brandId}
		 */
		"GET_USER_PLAY_INFO": "User/GetUserPlayInfo",
		/**
		 * 生成一个红包
		 */
		"CREATE_REDPACKET": "Redpacket/CreateRedpacketActivity",
		/**
		 * 取消红包
		 * {redpacketSendId}
		 */
		"CANCEL_REDPACKET_ACTIVITY": "Redpacket/CancelRedpacketActivity",
		/**
		 * 获取发送红包的支付状态
		 * {redpacketSendId}
		 */
		"GET_REDPACKET_ACTIVITY_STATUS": "Redpacket/GetRedpacketActivityStatus",
		/**
		 * 获取小程序码
		 * {path}&{width}&{scene}
		 */
		"CREATE_MINI_PRO_CODE": "WxSupport/CreateMiniProCode",
		/**
		 * 上传语音接口
		 * {redpacketSendId}&{userId}?brandId={brandId}
		 */
		"UPLOAD_VOICE": "Play/PlayAudio",
		/**
		 * 获取用户余额
		 * {userId}
		 */
		"GET_USER_ASSETS": "User/GetUseAssets",
		/**
		 * 申请提现
		 * {userId}&{money}
		 */
		"APPLY_WITH_DRAW_CASH": "User/ApplyWithdrawCash",
		/**
		 * 用户登录后写访问日志
		 * {userId}&{brandId}
		 */
		"CREATE_USER_VISIT_LOG": "User/CreateUserVisitLog"

	}
}

module.exports.config = config;