Potree.BinaryLoader = class BinaryLoader{
	constructor(version, boundingBox, scale){
		if (typeof (version) === 'string') {
			this.version = new Potree.Version(version);
		} else {
			this.version = version;
		}

		this.boundingBox = boundingBox;
		this.scale = scale;
	}

	extension() {
		return '.bin';
	}

 	workerPath() {
		return Potree.scriptPath + '/workers/BinaryDecoderWorker.js';
	}

	load(node){
		if (node.loaded) {
			return;
		}

		let url = node.getURL();
		let path = node.getHierarchyPath() + '/' + node.name;

		if (this.version.equalOrHigher('1.4')) {
			url += this.extension();
			path += this.extension();
		}

		url += Potree.getSignatureKeyForPath(path);

		let xhr = Potree.XHRFactory.createXMLHttpRequest();
		xhr.open('GET', url, true);
		xhr.responseType = 'arraybuffer';
		xhr.overrideMimeType('text/plain; charset=x-user-defined');
		xhr.onreadystatechange = () => {
			if (xhr.readyState === 4) {
				if((xhr.status === 200 || xhr.status === 0) && xhr.response !== null){
					let buffer = xhr.response;
					this.parse(node, buffer);
				} else {
					throw new Error(`Failed to load file! HTTP status: ${xhr.status}, file: ${url}`);
				}
			}
		};
		
		try {
			xhr.send(null);
		} catch (e) {
			console.log('fehler beim laden der punktwolke: ' + e);
		}
	};

	parse(node, buffer){
		let pointAttributes = node.pcoGeometry.pointAttributes;
		let numPoints = buffer.byteLength / node.pcoGeometry.pointAttributes.byteSize;

		if (this.version.upTo('1.5')) {
			node.numPoints = numPoints;
		}

		let workerPath = this.workerPath();
		let worker = Potree.workerPool.getWorker(workerPath);

		worker.onmessage = function (e) {

			let data = e.data;
			let buffers = data.attributeBuffers;
			let tightBoundingBox = new THREE.Box3(
				new THREE.Vector3().fromArray(data.tightBoundingBox.min),
				new THREE.Vector3().fromArray(data.tightBoundingBox.max)
			);

			Potree.workerPool.returnWorker(workerPath, worker);

			let geometry = new THREE.BufferGeometry();

			for(let property in buffers){
				let buffer = buffers[property].buffer;

				if (parseInt(property) === Potree.PointAttributeNames.POSITION_CARTESIAN) {
					geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(buffer), 3));
				} else if (parseInt(property) === Potree.PointAttributeNames.COLOR_PACKED) {
					geometry.addAttribute('color', new THREE.BufferAttribute(new Uint8Array(buffer), 4, true));
				} else if (parseInt(property) === Potree.PointAttributeNames.INTENSITY) {
					geometry.addAttribute('intensity', new THREE.BufferAttribute(new Float32Array(buffer), 1));
				} else if (parseInt(property) === Potree.PointAttributeNames.CLASSIFICATION) {
					geometry.addAttribute('classification', new THREE.BufferAttribute(new Uint8Array(buffer), 1));
				} else if (parseInt(property) === Potree.PointAttributeNames.NORMAL_SPHEREMAPPED) {
					geometry.addAttribute('normal', new THREE.BufferAttribute(new Float32Array(buffer), 3));
				} else if (parseInt(property) === Potree.PointAttributeNames.NORMAL_OCT16) {
					geometry.addAttribute('normal', new THREE.BufferAttribute(new Float32Array(buffer), 3));
				} else if (parseInt(property) === Potree.PointAttributeNames.NORMAL) {
					geometry.addAttribute('normal', new THREE.BufferAttribute(new Float32Array(buffer), 3));
				} else if (parseInt(property) === Potree.PointAttributeNames.INDICES) {
					let bufferAttribute = new THREE.BufferAttribute(new Uint8Array(buffer), 4);
					bufferAttribute.normalized = true;
					geometry.addAttribute('indices', bufferAttribute);
				} else if (parseInt(property) === Potree.PointAttributeNames.SPACING) {
					let bufferAttribute = new THREE.BufferAttribute(new Float32Array(buffer), 1);
					geometry.addAttribute('spacing', bufferAttribute);
				}
			}


			tightBoundingBox.max.sub(tightBoundingBox.min);
			tightBoundingBox.min.set(0, 0, 0);

			let numPoints = e.data.buffer.byteLength / pointAttributes.byteSize;
			
			node.numPoints = numPoints;
			node.geometry = geometry;
			node.mean = new THREE.Vector3(...data.mean);
			node.tightBoundingBox = tightBoundingBox;
			node.loaded = true;
			node.loading = false;
			node.estimatedSpacing = data.estimatedSpacing;
			Potree.numNodesLoading--;
		};

		let message = {
			buffer: buffer,
			pointAttributes: pointAttributes,
			version: this.version.version,
			min: [ node.boundingBox.min.x, node.boundingBox.min.y, node.boundingBox.min.z ],
			offset: [node.pcoGeometry.offset.x, node.pcoGeometry.offset.y, node.pcoGeometry.offset.z],
			scale: this.scale,
			spacing: node.spacing,
			hasChildren: node.hasChildren,
			name: node.name
		};
		worker.postMessage(message, [message.buffer]);
	};

	
};

