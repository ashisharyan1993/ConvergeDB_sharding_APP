const oracledb = require('oracledb');
var SimpleOracleDB = require('simple-oracledb');
SimpleOracleDB.extend(oracledb);
let _db;

const Dbconnect = () => {

	const dbAttr = {
		// user: "devuser",
		// password: "Oracle_4U",
		// connectString: "132.145.216.213:1530/markuppdb"
		user: "appnodejs",
		password: "Oracle_4U",
		connectString: "132.145.158.143:1521/APPPDB"
	}
	return new Promise((resolve, reject) => {
		oracledb.getConnection(dbAttr)
			.then(connection => {
				_db = connection;
				resolve('Connected')
			})
			.catch((err) => {
				console.log(err)
			})
	})

}

const getDb = () => {
	if (!_db) {
		// return _db;
		Dbconnect().then(result => {
			return _db;
		})
	}
	if (_db) {
		return _db;
	}
}

module.exports = {
	Dbconnect: Dbconnect,
	getDb: getDb,
};
