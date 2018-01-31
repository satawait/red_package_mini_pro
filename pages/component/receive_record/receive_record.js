const app = getApp();

Component({

	properties: {
		recordData: {
			type: Object,
			value: {}
		}
	},

	data: {
		// userInfo
	},

	ready: function () {
		if (app.globalData.userInfo) {
			this.setData({
				userInfo: app.globalData.userInfo
			})
		}
	},

	methods: {}

})