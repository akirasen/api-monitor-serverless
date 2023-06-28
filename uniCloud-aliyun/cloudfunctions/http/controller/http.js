const { Controller } = require("uni-cloud-router");
module.exports = class httpController extends Controller {	
	async monitor() {
		const { ctx, service } = this;
		return await service.http.monitor(ctx);
	}
};
