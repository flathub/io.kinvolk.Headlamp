# Headlamp (Flatpak build files)

[Headlamp](https://github.com/kinvolk/headlamp/) is an easy-to-use and
extensible Kubernetes web UI.

Headlamp was created to be a Kubernetes web UI that has the traditional functionality of other web UIs/dashboards available (i.e. to list and view resources) as well as other features.

This repository has the necessary files to build Headlamp as a Flatpak.

## Updating to a new Headlamp version

We provide a helper script to update the Headlamp release to a new version: `update-release.js`.
Node JS needs to be installed and it's the only dependency for the script.

Here's how to use it to bump Headlamp's version:
```shell
./update-release.js 0.15.1
```

The script should update both the headlamp-source.json and the appdata.xml file.

## License

The code in this repository is licensed as [Apache 2.0](./LICENSE).
