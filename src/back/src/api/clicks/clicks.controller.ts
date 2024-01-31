import { Controller, Get, Header } from '@nestjs/common';
import { createClient } from 'redis';

console.log(process.env.REDIS_SERVER);
const client = createClient({
  url: 'redis://default:01082a7f147849a7bf623acf830ca41d@eu2-learning-dane-32666.upstash.io:32666',
});
client.on('error', (err) => console.log('Redis Client Error', err));

@Controller('api/clicks')
export class ClicksController {
  @Get()
  @Header('Content-type', 'application/json')
  @Header('Access-Control-Allow-Origin', '*')
  async clicks() {
    client.isOpen || (await client.connect());

    let clicks = parseInt(await client.get('clicks')) || 0;

    return { clicks: clicks };
  }

  @Get('incr')
  @Header('Content-type', 'application/json')
  @Header('Access-Control-Allow-Origin', '*')
  async incr() {
    client.isOpen || (await client.connect());

    await client.incr('clicks');

    let clicks = parseInt(await client.get('clicks'));

    return { clicks: clicks };
  }
}
