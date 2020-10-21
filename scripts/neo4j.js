var neo4j = require('neo4j-driver')

// var graphenedbURL = process.env.GRAPHENEDB_BOLT_URL;
// var graphenedbUser = process.env.GRAPHENEDB_BOLT_USER;
// var graphenedbPass = process.env.GRAPHENEDB_BOLT_PASSWORD;

// * Local Development Variables
var 

var driver = neo4j.driver("bolt://hobby-oiejiallpccngbkecgppoofl.dbs.graphenedb.com:24787", neo4j.auth.basic("app187763744-x6KJc4", "b.HQC3EVBfk0vi.Opl6Tf0r1OSFUNc0"), {encrypted: 'ENCRYPTION_ON'});

var session = driver.session();

session.run("CREATE (a:Person {name: 'Alice'}) RETURN a");

