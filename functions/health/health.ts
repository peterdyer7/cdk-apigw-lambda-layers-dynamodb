const config = require('/opt/nodejs/config');
const time = require('/opt/nodejs/time');

const REGION = process.env.REGION || '';
// const ACCOUNT = process.env.ACCOUNT || '';
const API = process.env.API || '';

export const handler = async function(event: any = {}, context: any) {
  const configuration = {
    aws_region: REGION,
    // aws_account: ACCOUNT,
    api: API,
    creator: config.creator,
    time: time.timenow()
  };

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(configuration)
  };
};
