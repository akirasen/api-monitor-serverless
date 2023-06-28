'use strict';
//这里使用阿里云的短信接口，也可以换成别的
const Core = require('@alicloud/pop-core');
const aliClient_id = "XXXXXXXXXXXXXXXXXXX"
const alliClient_secret = "XXXXXXXXXXXXXXXXXXX"
const db = uniCloud.database(); //代码块为cdb
exports.main = async (event, context) => {
		
	const jobCheck = await db.collection('monitor-job').where({state:1}).get()
	for(let i = 0;i < jobCheck.data.length;i++){
		let apiCheck = await uniCloud.httpclient.request(jobCheck.data[i].api, {
			method: jobCheck.data[i].method,
			data: {
			},  
			//dataType: 'json' // 指定返回值为json格式，自动进行parse  
		});
		if(apiCheck.status !== jobCheck.data[i].expected_to){
			const monitorLog = await db.collection('monitor-log').add({
				api:jobCheck.data[i].api,
				expected_to:jobCheck.data[i].expected_to,
				results:apiCheck.status,
				notify:jobCheck.data[i].notify,
				create_date:new Date()
			})
			//以下实现发送短信
			var client = new Core({
			  accessKeyId: aliClient_id,
			  accessKeySecret: alliClient_secret,
			  endpoint: 'https://dysmsapi.aliyuncs.com',
			  apiVersion: '2017-05-25'
			});
			var params = {
			  "SignName": "XXXXXXXXXXXXXXXXXXX",
			  "TemplateCode": "XXXXXXXXXXXXXXXXXXX",
			  "TemplateParam": "{\"apiname\":\""+jobCheck.data[i].api+"\"}",
			  "PhoneNumbers": jobCheck.data[i].notify
			}
			var requestOption = {
			  method: 'POST',
			  formatParams: false,
			};
			client.request('SendSms', params, requestOption).then((result) => {
			  console.log(JSON.stringify(result));
			}, (ex) => {
			  console.log(ex);
			})
			//以上负责发送短信
			//发送短信提醒后，将监控任务置于暂停状态，需要处理以后手动启动
			const result = await db.collection('monitor-job').where({_id:jobCheck.data[i]._id}).update({
				state:0,
				count:jobCheck.data[i].count+1,
				last_update_date:new Date()
			})
		}
	}
};
