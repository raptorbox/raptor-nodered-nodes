.PHONY: release

release:
	npm run release
	npm push origin master
	npm push --tags origin master
	npm publish
