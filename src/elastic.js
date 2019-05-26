import { Client } from "@elastic/elasticsearch";

const elastic = new Client({
	node: `http://${process.env.ES_HOST}:${process.env.ES_PORT}/`
});

export default elastic;
