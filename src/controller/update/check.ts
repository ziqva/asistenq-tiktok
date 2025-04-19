import { Request, Response } from "express";
import { AppUpdater } from "electron-updater";

export default async function check(
  req: Request,
  res: Response,
  updater: AppUpdater
): Promise<void> {
  try {
    updater.checkForUpdates().then((data) => {
      res.json({
        error: false,
        data,
        msg: null,
      });
    });
  } catch (err) {
    res.json({
      error: true,
      msg: err?.toString(),
    });
  }
}
