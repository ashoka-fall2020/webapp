ls -al
echo "ls-al"
cd /home/ubuntu
ls -al
echo "ls-al"
pwd
sudo npm i pm2 -g
cd webapp
sudo cp /home/ubuntu/.env ./.env
echo "starting cloud watch"
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/home/ubuntu/webapp/cloudwatch-config.json -s
echo "starting webapp"
sudo pm2 start server.js
echo "webapp running.."