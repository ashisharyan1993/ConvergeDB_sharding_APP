const oracledb = require('oracledb');
var SimpleOracleDB = require('simple-oracledb');
SimpleOracleDB.extend(oracledb);
let _db;

const Dbconnect2 = () => {

	const dbAttr = {
		// user: "OA_HERE_MAPS",
		// password: "OR##123acle",
		// connectString: "129.213.155.161:1530/SPAGRAPDB"
		user: "appnodejs",
		password: "Oracle_4U",
		connectString: "132.145.158.143:1521/apppdb"
	}
	return new Promise((resolve, reject) => {
		oracledb.getConnection(dbAttr)
			.then(connection => {
				_db = connection;
				resolve('Spatial DB Connected')
			})
			.catch((err) => {
				console.log(err)
			})
	})

}

const getDb2 = () => {
	if (!_db) {
		// return _db;
		Dbconnect2().then(result => {
			return _db;
		})
	}
	if (_db) {
		return _db;
	}
}

module.exports = {
	Dbconnect2: Dbconnect2,
	getDb2: getDb2,
};
