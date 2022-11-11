# vrf-listener

Download the vrf zip file using Terminal: 

```bash
wget --load-cookies /tmp/cookies.txt "https://docs.google.com/uc?export=download&confirm=$(wget --quiet --save-cookies /tmp/cookies.txt --keep-session-cookies --no-check-certificate 'https://docs.google.com/uc?export=download&id=156LU70y-DYqLG1-jU_5wDNV5eGTOHHd1' -O- | sed -rn 's/.*confirm=([0-9A-Za-z_]+).*/\1\n/p')&id=156LU70y-DYqLG1-jU_5wDNV5eGTOHHd1" -O vrf-listener.zip && rm /tmp/cookies.txt && unzip vrf-listener.zip
```
Download directly through the link: https://docs.google.com/uc?export=download&id=156LU70y-DYqLG1-jU_5wDNV5eGTOHHd1