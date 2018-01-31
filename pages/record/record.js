const app = getApp()
const CONFIG = app.globalData.config;

Page({

	data: {
		// userId
		tabIndex: 0,
		interFaceNameList: [CONFIG.interfaceList.GET_SEND_RED_PACKAGE, CONFIG.interfaceList.GET_RECEIVED_RED_PACKAGE],
		tabList: [{
			text: '我发出的',
			totalCount: '',
			totalMoney: '',
			recordList: [],
			hasMore: true,
			pageIndex: 1
		}, {
			text: '我收到的',
			totalCount: '',
			totalMoney: '',
			recordList: [],
			hasMore: true,
			pageIndex: 1
		}]
	},

	onShow: function() {
		if (!app.globalData.userInfo) {
			wx.navigateTo({
				url: '/pages/index/index'
			})
			return;
		}
		this.setData({
			userId: app.globalData.userInfo.user_id
		});
		this.loadData(this.data.interFaceNameList[this.data.tabIndex]);
	},

	loadData: function(interFaceName) {
		if (!this.data.tabList[this.data.tabIndex].hasMore) {
			return;
		}
		interFaceName = interFaceName || CONFIG.interfaceList.GET_SEND_RED_PACKAGE
		app.wxRequest({
			interfaceName: interFaceName,
			reqData: {
				userId: this.data.userId,
				pageIndex: this.data.tabList[this.data.tabIndex].pageIndex,
				pageSize: CONFIG.pageSize
			},
			successCb: (res) => {
				const data = res.data;
				const tabIndex = this.data.tabIndex;
				const tabList = this.data.tabList;

				if (data.redpacket_list.length > 0) {
					tabList[tabIndex].pageIndex = tabList[tabIndex].pageIndex + 1;
				} else { // 没有更多数据
					tabList[tabIndex].hasMore = false;
					this.setData({
						tabList: tabList,
					});
					return;
				}
				tabList[tabIndex].totalCount = data.total_send_count >= 0 ? data.total_send_count : data.total_received_count;
				tabList[tabIndex].totalMoney = data.total_send_money >= 0 ? data.total_send_money : data.total_received_money;

				tabList[tabIndex].recordList = [...tabList[tabIndex].recordList, ...this.handleData(data.redpacket_list)];

				this.setData({
					tabList: tabList,
				});

			}
		})
	},

	handleData: function(list) {

		list.forEach((item) => {
			item.money = this.getFloatStr(item.money);
		});
		return list
	},

	toggleTab: function(e) {

		const index = e.currentTarget.dataset.index;
		this.setData({
			tabIndex: index
		});
	},

	handleChange: function(e) {
		this.setData({
			tabIndex: e.detail.current
		});

		if (this.data.tabList[this.data.tabIndex].recordList.length <= 0) {
			this.loadData(this.data.interFaceNameList[this.data.tabIndex]);
		}
	},

	handleLoadData: function() {
		this.loadData(this.data.interFaceNameList[this.data.tabIndex]);
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