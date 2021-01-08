const oracledb = require('oracledb');
var SimpleOracleDB = require('simple-oracledb');
SimpleOracleDB.extend(oracledb);
let _db;

const Dbconnect3 = () => {

	const dbAttr = {
		user: "ANALYTICS",
		password: "Oracle_4U",
		connectString: "132.145.158.143:1521/apppdb"
	}
	return new Promise((resolve, reject) => {
		oracledb.getConnection(dbAttr)
			.then(connection => {
				_db = connection;
				resolve('Analytics DB Connected')
			})
			.catch((err) => {
				console.log(err)
			})
	})

}

const getDb3 = () => {
	if (!_db) {
		// return _db;
		Dbconnect3().then(result => {
			return _db;
		})
	}
	if (_db) {
		return _db;
	}
}

module.exports = {
	Dbconnect3: Dbconnect3,
	getDb3: getDb3,
};
