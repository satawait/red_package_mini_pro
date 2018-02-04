const app = getApp()

Page({

	data: {
		// currentIndex //当前点击的问题的索引
		// isSpread //判断是否已经展开
		// questionList
		imgUrl: app.globalData.imgUrl
	},

	onShow: function() {
		this.setData({
			questionList: [{
				question: '说一说，语音口令怎么玩？',
				answer: '你可以设置一个带奖励的语音口令，好友说对口令才能领到奖励'
			}, {
				question: '我支付了但没有发出去？',
				answer: '请在主页的【我的记录】中找到相应的记录，点击进入详情后点击【转发好友】可把口令转发给好友或群，你也可以生成朋友圈分享图后发朋友圈'
			}, {
				question: '好友可以转发我的口令吗？',
				answer: '可以的，您分享给好友或者转发到微信群的语音口令，其他好友均可再次转发'
			}, {
				question: '发口令会收取服务费吗？',
				answer: '发语音口令会收取一定的服务费'
			}, {
				question: '未领取的金额会怎样处理？',
				answer: '未领取的金额将于24小时后退至说一说小程序余额；同时，未领取金额的服务费也将全部退回'
			}, {
				question: '如何提现到微信钱包？',
				answer: '在主页的【余额提现】或详情页的【去提现】均可跳转至余额提现页面进行提现，提现金额每次至少1元，每天至多提现3次'
			}, {
				question: '提现会收取费吗？多久到账？',
				answer: '提现不收取服务费；申请提现后会在1-7个工作日内转账到您的微信钱包'
			}],
		});
	},

	handleClick: function(e) {
		const index = e.currentTarget.dataset.index;
		const isSpread = this.data.currentIndex === index ? !this.data.isSpread : true;
		this.setData({
			currentIndex: index,
			isSpread: isSpread
		});
	}
})