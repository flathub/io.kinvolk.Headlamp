all: flatpak

.PHONY: build-flatpak
flatpak:
	flatpak-builder --force-clean build --user --install ./io.kinvolk.Headlamp.yaml
