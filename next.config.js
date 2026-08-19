/* eslint-disable @typescript-eslint/no-require-imports */

const os = require("os");

/** @type {import('next').NextConfig} */

const networkInterfaces = os.networkInterfaces();

const localNetworkIPs = Object.values(networkInterfaces)
  .flat()
  .filter(
    (address) =>
      address &&
      address.family === "IPv4" &&
      !address.internal
  )
  .map((address) => address.address);

const nextConfig = {
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    ...localNetworkIPs,
  ],
};

module.exports = nextConfig;