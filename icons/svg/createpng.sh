#!/bin/bash

# validate dependencies
for dep in {inkscape,convert,pngcrush}; do
	command -v $dep >/dev/null 2>&1 || { 
		echo >&2 "ERROR: the required binary '$dep' could not be found"
		exit 1
	}
done

# create all various size favicon pngs
for size in {196,144,128,114,72,32}; do
	png=../favicon-$size.png
	crushed=favicon-$size-crushed.png

	inkscape \
	--without-gui \
	--export-png=$png \
	--export-width=$size \
	--export-height=$size \
	favicon.svg

	# with pngcrush you can't read from stdin or overwrite the source file
	pngcrush \
	-m 0 \
	-m 101 \
	-m 113 \
	-m 115 \
	$png \
	$crushed

	mv $crushed $png
done

mv ../favicon-32.png ../favicon.png

# create the .ico file
convert ../favicon.png ../favicon.ico


