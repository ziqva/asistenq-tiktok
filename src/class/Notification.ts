import * as fs from "fs";
import * as path from "path";
// @ts-ignore
import sound from "sound-play";
import Setting from "./Setting";
import * as electron from 'electron'
// @ts-ignore
import * as isPackaged from 'electron-is-packaged'
import PublicMonitoring from "./PublicMonitoring";

export default class Notification {
  private toastActive: boolean;
  private soundActive: boolean;
  private setting: Setting;
  private soundVolume: number;
  private soundFilename: string;
  private soundDir: string;
  public publicMonitoring: PublicMonitoring | null = null
  constructor({ setting }: { setting: Setting }) {
    this.soundDir = isPackaged.isPackaged ? path.join(process.resourcesPath, 'dist/sounds') : path.join(__dirname, "../sounds");
    this.setting = setting;
    this.toastActive = true;
    this.soundActive = true;
    this.soundVolume = 100;
    this.soundFilename = "sound_1";
    this.init();
    electron.app.on('ready', () => {
      electron.app.setAppUserModelId('ziqva-labs-asistenq')
    })
  }

  /**
   * Returns the current state of the notification.
   *
   * @return {NotificationState} The current state of the notification.
   */
  public async get(): Promise<NotificationState> {
    return {
      toastActive: this.toastActive,
      soundActive: this.soundActive,
      soundVolume: this.soundVolume,
      soundFilename: this.soundFilename,
      soundFilenames: this.getSoundFilenames(),
      customList: await this.getCustoms()
    };
  }

  /**
   * Retrieves a list of custom ringtone audios from the settings.
   *
   * @return {Promise<string[]>} An array of custom ringtone audio names.
   */
  public async getCustoms(): Promise<string[]> {
    const result = await this.setting.get("custom_ringtone_audios")
    return result.split('|||').map((x: string) => x.trim()).filter((x: string) => x.length > 0)
  }
  
  /**
   * Retrieves the filenames of all sound files in the sound directory.
   *
   * @return {string[]} An array of sound file names.
   */
  private getSoundFilenames(): string[] {
    const files = fs.readdirSync(this.soundDir);
    return files.map((file) => path.parse(file).name);
  }

  /**
   * Initializes the function asynchronously.
   *
   * @return {Promise<void>} - A promise that resolves when the initialization is complete.
   */
  private async init(): Promise<void> {
    try {
      this.toastActive =
        (await this.setting.get("notification_toast_active")) === 1;
      this.soundActive =
        (await this.setting.get("notification_sound_active")) === 1;
      this.soundVolume = await this.setting.get("notification_sound_volume");
      this.soundFilename = await this.setting.get(
        "notification_sound_filename"
      );
    } catch (err) {
      console.error('failed for init the notification: ', err)
    }
  }

  /**
   * Updates the notification state.
   *
   * @param {NotificationState} state - the new notification state
   * @return {Promise<void>} a promise that resolves when the update is complete
   */
  public async update(state: NotificationState): Promise<void> {
    try {
      await this.setting.set(
        "notification_toast_active",
        state.toastActive ? 1 : 0
      );
      await this.setting.set(
        "notification_sound_active",
        state.soundActive ? 1 : 0
      );
      await this.setting.set("notification_sound_volume", state.soundVolume);
      await this.setting.set("notification_sound_filename", state.soundFilename);
  
      this.toastActive = state.toastActive;
      this.soundVolume = state.soundVolume;
      this.soundActive = state.soundActive;
      this.soundFilename = state.soundFilename;
    } catch(err) {
      console.error('failed for update: ', err)
    }
  }

  /**
   * Displays a toast message and plays a sound, if enabled.
   *
   * @param {object} options - The options for the toast message.
   * @param {string} options.title - The title of the toast message.
   * @param {string} options.message - The message of the toast message.
   * @param {Function} [options.buttonOnClick] - The function to be executed when the button in the toast message is clicked.
   * @return {void}
   */
  show({
    title,
    message,
    buttonOnClick,
  }: {
    title: string;
    message: string;
    buttonOnClick?: Function | undefined;
  }): void {
    if(this.publicMonitoring) { this.publicMonitoring.push(`${title} - ${message}`) }
    if (this.toastActive) {
      try {
        // toast.create({
        //   title,
        //   message,
        //   icon: path.join(__dirname, "../images/icon.png"),
        //   duration: 10000,
        // });
        const notification = new electron.Notification({
          title,
          body: message,
          timeoutType: 'never',
          icon: path.join(__dirname, '../images/icon.png'),
          silent: true,
          urgency: 'critical',
        })
        notification.show()
        notification.on('click', () => {
          notification.close()
        })

        setTimeout(() => {
          try {
            notification.close()
          } catch(err) {}
        }, 5000)
      } catch (err) {}
    }
    if (this.soundActive) {
      try {
        const mp3Path = path.join(this.soundDir, `${this.soundFilename}.mp3`);
        console.log('target mp3 path: ', mp3Path)
        const volume: number = this.soundVolume / 100;
        sound.play(mp3Path, volume);
      } catch (err) {
        console.error('Failed for play the sound: ', err.message || err)
        electron.dialog.showMessageBoxSync(electron.BrowserWindow.getAllWindows()[0], {
          title: "Notification error",
          message: `Failed for play the sound: ${err.mesage || err}`
        })
      }
    }
  }

  /**
   * Removes any non-alphanumeric characters and replaces consecutive spaces with underscores.
   *
   * @param {string} str - The input string to be sanitized.
   * @return {string} The sanitized string.
   */
  private sanitizeString(str: string): string {
    return str.replace(/[^a-zA-Z0-9\s\.]+/g, match => match === ' ' ? '_' : '').split(' ').join("_");
  }

  

  /**
   * Adds a new ringtone by prompting the user to select an mp3 file. The selected file is then
   * sanitized, its name is added to the list of custom audio ringtones, and it is copied to the
   * sound directory. If the file already exists in the sound directory, it is replaced.
   *
   * @return {Promise<void>} A promise that resolves when the ringtone has been added.
   * @throws {Error} If the user cancels the file selection dialog or does not select any file.
   */
  public async addNewRingtone(): Promise<void> {
    const { dialog } = electron
    const result = await dialog.showOpenDialog(electron.BrowserWindow.getAllWindows()[0], {
      properties: ['openFile'],
      filters: [
        { name: "MP3 File", extensions: ['mp3'] }
      ],
      title: "Select an mp3 file"
    })
    if(result.canceled || result.filePaths.length < 1) { throw new Error(`Anda tidak memilih file video apapun`) }
    const filePath = result.filePaths[0]
    const targetFilename = this.sanitizeString(path.basename(filePath)).toLowerCase()
    
    let customAudioRes: string[] = (await this.setting.get('custom_ringtone_audios')).split('|||')
    const targetName = targetFilename.split(".mp3")[0]
    if(!customAudioRes.includes(targetName)) {
      customAudioRes.push(targetName)
    }
    await this.setting.set('custom_ringtone_audios', customAudioRes.join('|||'))
    const targetSoundPath = path.join(this.soundDir, targetFilename)
    console.log(targetSoundPath)
    if(fs.existsSync(targetSoundPath)) { fs.rmSync(targetSoundPath) }
    fs.cpSync(result.filePaths[0], targetSoundPath)
  }
  
  /**
   * Removes a custom ringtone from the list of custom ringtones and deletes the corresponding file.
   *
   * @param {string} name - The name of the custom ringtone to remove.
   * @return {Promise<void>} A promise that resolves when the custom ringtone is successfully removed.
   * @throws {Error} If the custom ringtone is not found.
   */
  public async removeCustomRingtone(name: string): Promise<void> {
    let customs = await this.getCustoms()
    if(!customs.includes(name)) { throw new Error('Ringtone was not found!') }
    customs = customs.filter(x => x !== name)
    await this.setting.set('custom_ringtone_audios', customs.join("|||"))
    if(this.soundFilename === name) {
      this.soundFilename = "sound_1"
      await this.setting.set('notification_sound_filename', 'sound_1')
    }
    const filePath = path.join(this.soundDir, name + '.mp3') 
    if(fs.existsSync(filePath)) { fs.unlinkSync(filePath) }
  }
}
