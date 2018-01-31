const app = getApp();

Component({

	properties: {
		recordData: {
			type: Object,
			value: {},
			observer: function (newVal, oldVal) {
				console.log(newVal, oldVal);
			}
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