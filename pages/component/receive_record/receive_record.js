const app = getApp();

Component({

	properties: {
		recordData: {
			type: Object,
			value: {}
		}
	},

	data: {
		userInfo: app.globalData.userInfo
	},

	ready: function () {
		setTimeout(() => {
			console.log(this.properties.recordData);
		}, 1000);
	},

	methods: {

	}

})