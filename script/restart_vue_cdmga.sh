sudo rm -rf /var/www/CDMGA-ui
sudo cp -r ./vueproject/dist /var/www/CDMGA-ui
sudo systemctl restart nginx
