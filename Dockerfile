FROM hypriot/rpi-node

ADD . /dishwasher

WORKDIR /dishwasher

RUN apt-get update && apt-get install -y libudev-dev bluez bluetooth usbutils
RUN npm install
RUN git clone https://github.com/50ButtonsEach/fliclib-linux-hci.git

ENTRYPOINT ["npm", "run"]

CMD ["shell"]
