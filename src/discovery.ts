import dgram from 'dgram';

export class discovery {
  getRobotIp(blid) {
    const server = dgram.createSocket('udp4');

    server.on('error', (err) => {
      throw Error(err);
      server.close();
      //cb(err);
    });

    server.on('message', (msg) => {
      try {
        const parsedMsg = JSON.parse(msg.toString());
        if (parsedMsg.hostname && parsedMsg.ip &&
                    ((parsedMsg.hostname.split('-')[0] === 'Roomba') ||
                        (parsedMsg.hostname.split('-')[0] === 'iRobot'))) {
          if (parsedMsg.hostname.split('-')[1] === blid) {
            server.close();
            return parsedMsg.ip;
            //cb(null, parsedMsg.ip);
          }
        }
      } catch (err) {
        server.close();
      }
    });

    server.on('listening', () => {
      //do nothing
    });

    server.bind(5678, () => {
      const message = Buffer.from('irobotmcs');
      server.setBroadcast(true);
      //server.send('hi', 0, 2, 5678, '255.255.255.255');
      server.send(message, 0, message.length, 5678, '255.255.255.255');
    });
  }
}
/*const discover = new discovery();
discover.getRobotIp('31B5C41071813760', (err, ip) => {
  if(err) {
    throw Error(err);
  }
  // eslint-disable-next-line no-console
  console.log(ip);
});
*/
