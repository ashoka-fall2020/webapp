ls -al
echo "ls-al"
cd /home/ubuntu
ls -al
echo "ls-al"
pwd
sudo npm i pm2 -g
cd webapp
sudo cp /home/ubuntu/.env ./.env
echo "starting webapp.."
sudo pm2 run prod
echo "webapp running.."