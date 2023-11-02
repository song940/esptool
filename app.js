import { ready } from 'https://lsong.org/scripts/dom.js';
import { readAsBinaryString } from 'https://lsong.org/scripts/file.js';
import { requestPort } from 'https://lsong.org/scripts/serialport.js';
import { ESPLoader, Transport } from './esptool.min.js';

ready(() => {
  const connect = document.getElementById('connect');
  const baudrate = document.getElementById('baudrate');
  const address = document.getElementById('address');
  const flash = document.getElementById('flash');
  const erase = document.getElementById('erase');
  const output = document.getElementById('output');
  const status = document.getElementById('status');
  const board = document.getElementById('device');
  const progressBar = document.querySelector('progress-bar');

  const terminal = {
    clean: () => output.value = '',
    write: data => output.value += data,
    writeLine: data => {
      output.value += data + '\n'
      output.scrollTop = output.scrollHeight;
    },
  };

  var loader;
  connect.addEventListener('click', async () => {
    const device = await requestPort();
    const transport = new Transport(device);
    status.textContent = await transport.get_info();
    const loaderOptions = {
      baudrate: +baudrate.value,
      transport,
      terminal,
    };
    loader = new ESPLoader(loaderOptions);
    const chip = await loader.main_fn();
    board.textContent = chip;
  });
  erase.addEventListener('click', async () => {
    await loader.erase_flash();
  });
  flash.addEventListener('click', async () => {
    const upload = document.getElementById('upload');
    const file = upload.files[0];
    if (!file) {
      console.error('No file selected');
      return
    }
    const data = await readAsBinaryString(file);
    const flashOptions = {
      fileArray: [ { data, address: +address.value } ],
      flashSize: "keep",
      eraseAll: false,
      compress: true,
      reportProgress: (index, written, total) => {
        progressBar.value = (written / total) * 100;
      },
      calculateMD5Hash: image =>
        CryptoJS.MD5(CryptoJS.enc.Latin1.parse(image)).toString(),
    };
    await loader.write_flash(flashOptions);
    console.log('Flash complete');
    await loader.hard_reset();
  });
});
