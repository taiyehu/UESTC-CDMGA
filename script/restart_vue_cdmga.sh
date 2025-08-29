rm -rf /var/www/CDMGA-ui
cp -r  /var/www//dist /var/www/CDMGA-ui
systemctl restart nginx
rm -rf /var/www//dist
