function Potree () {

}
Potree.version = {
	major: 1,
	minor: 6,
	suffix: ''
};

Potree.pointBudget = 1 * 1000 * 1000;

Potree.framenumber = 0;

Potree.numNodesLoading = 0;
Potree.maxNodesLoading = 4;

Potree.Shaders = {};

Potree.webgl = {
	shaders: {},
	vaos: {},
	vbos: {}
};

Potree.debug = {};

Potree.scriptPath = null;
if (document.currentScript.src) {
	Potree.scriptPath = new URL(document.currentScript.src + '/..').href;
	if (Potree.scriptPath.slice(-1) === '/') {
		Potree.scriptPath = Potree.scriptPath.slice(0, -1);
	}
} else {
	console.error('Potree was unable to find its script path using document.currentScript. Is Potree included with a script tag? Does your browser support this function?');
}
Potree.scriptPath = '/pointcloud-viewer/libs/potree/';

Potree.resourcePath = Potree.scriptPath + '/resources';

class EnumItem{
	constructor(object){
		for(let key of Object.keys(object)){
			this[key] = object[key];
		}
	}

	inspect(){
		return `Enum(${this.name}: ${this.value})`;
	}
};

class Enum{

	constructor(object){
		this.object = object;

		for(let key of Object.keys(object)){
			let value = object[key];

			if(typeof value === "object"){
				value.name = key;
			}else{
				value = {name: key, value: value};
			}
			
			this[key] = new EnumItem(value);
		}
	}

	fromValue(value){
		for(let key of Object.keys(this.object)){
			if(this[key].value === value){
				return this[key];
			}
		}

		throw new Error(`No enum for value: ${value}`);
	}
	
};


Potree.CameraMode = {
	ORTHOGRAPHIC: 0,
	PERSPECTIVE: 1
};

Potree.ClipTask = {
	NONE: 0,
	HIGHLIGHT: 1,
	SHOW_INSIDE: 2,
	SHOW_OUTSIDE: 3
};

Potree.ClipMethod = {
	INSIDE_ANY: 0,
	INSIDE_ALL: 1
};

Potree.MOUSE = {
	LEFT: 0b0001,
	RIGHT: 0b0010,
	MIDDLE: 0b0100
};

Potree.timerQueries = {};

Potree.measureTimings = false;

Potree.startQuery = function (name, gl) {
	let ext = gl.getExtension('EXT_disjoint_timer_query');

	if(!ext){
		return;
	}

	if (Potree.timerQueries[name] === undefined) {
		Potree.timerQueries[name] = [];
	}

	let query = ext.createQueryEXT();
	ext.beginQueryEXT(ext.TIME_ELAPSED_EXT, query);

	Potree.timerQueries[name].push(query);

	return query;
};

Potree.endQuery = function (query, gl) {
	let ext = gl.getExtension('EXT_disjoint_timer_query');

	if(!ext){
		return;
	}

	ext.endQueryEXT(ext.TIME_ELAPSED_EXT);
};

Potree.resolveQueries = function (gl) {
	let ext = gl.getExtension('EXT_disjoint_timer_query');

	let resolved = new Map();

	for (let name in Potree.timerQueries) {
		let queries = Potree.timerQueries[name];

		let remainingQueries = [];
		for(let query of queries){

			let available = ext.getQueryObjectEXT(query, ext.QUERY_RESULT_AVAILABLE_EXT);
			let disjoint = gl.getParameter(ext.GPU_DISJOINT_EXT);

			if (available && !disjoint) {
				// See how much time the rendering of the object took in nanoseconds.
				let timeElapsed = ext.getQueryObjectEXT(query, ext.QUERY_RESULT_EXT);
				let miliseconds = timeElapsed / (1000 * 1000);

				if(!resolved.get(name)){
					resolved.set(name, []);
				}
				resolved.get(name).push(miliseconds);
			}else{
				remainingQueries.push(query);
			}
		}

		if (remainingQueries.length === 0) {
			delete Potree.timerQueries[name];
		}else{
			Potree.timerQueries[name] = remainingQueries;
		}
	}

	return resolved;
};

Potree.toMaterialID = function(materialName){
	if (materialName === 'RGB'){
		return Potree.PointColorType.RGB;
	} else if (materialName === 'Color') {
		return Potree.PointColorType.COLOR;
	} else if (materialName === 'Elevation') {
		return Potree.PointColorType.HEIGHT;
	} else if (materialName === 'Intensity') {
		return Potree.PointColorType.INTENSITY;
	} else if (materialName === 'Intensity Gradient') {
		return Potree.PointColorType.INTENSITY_GRADIENT;
	} else if (materialName === 'Classification') {
		return Potree.PointColorType.CLASSIFICATION;
	} else if (materialName === 'Return Number') {
		return Potree.PointColorType.RETURN_NUMBER;
	} else if (materialName === 'Source') {
		return Potree.PointColorType.SOURCE;
	} else if (materialName === 'Level of Detail') {
		return Potree.PointColorType.LOD;
	} else if (materialName === 'Point Index') {
		return Potree.PointColorType.POINT_INDEX;
	} else if (materialName === 'Normal') {
		return Potree.PointColorType.NORMAL;
	} else if (materialName === 'Phong') {
		return Potree.PointColorType.PHONG;
	} else if (materialName === 'Index') {
		return Potree.PointColorType.POINT_INDEX;
	} else if (materialName === 'RGB and Elevation') {
		return Potree.PointColorType.RGB_HEIGHT;
	} else if (materialName === 'Composite') {
		return Potree.PointColorType.COMPOSITE;
	}
};

Potree.toMaterialName = function(materialID) {
	if (materialID === Potree.PointColorType.RGB) {
		return 'RGB';
	} else if (materialID === Potree.PointColorType.COLOR) {
		return 'Color';
	} else if (materialID === Potree.PointColorType.HEIGHT) {
		return 'Elevation';
	} else if (materialID === Potree.PointColorType.INTENSITY) {
		return 'Intensity';
	} else if (materialID === Potree.PointColorType.INTENSITY_GRADIENT) {
		return 'Intensity Gradient';
	} else if (materialID === Potree.PointColorType.CLASSIFICATION) {
		return 'Classification';
	} else if (materialID === Potree.PointColorType.RETURN_NUMBER) {
		return 'Return Number';
	} else if (materialID === Potree.PointColorType.SOURCE) {
		return 'Source';
	} else if (materialID === Potree.PointColorType.LOD) {
		return 'Level of Detail';
	} else if (materialID === Potree.PointColorType.NORMAL) {
		return 'Normal';
	} else if (materialID === Potree.PointColorType.PHONG) {
		return 'Phong';
	} else if (materialID === Potree.PointColorType.POINT_INDEX) {
		return 'Index';
	} else if (materialID === Potree.PointColorType.RGB_HEIGHT) {
		return 'RGB and Elevation';
	} else if (materialID === Potree.PointColorType.COMPOSITE) {
		return 'Composite';
	}
};

Potree.getMeasurementIcon = function(measurement){
	if (measurement instanceof Potree.Measure) {
		if (measurement.showDistances && !measurement.showArea && !measurement.showAngles) {
			return `${Potree.resourcePath}/icons/distance.svg`;
		} else if (measurement.showDistances && measurement.showArea && !measurement.showAngles) {
			return `${Potree.resourcePath}/icons/area.svg`;
		} else if (measurement.maxMarkers === 1) {
			return `${Potree.resourcePath}/icons/point.svg`;
		} else if (!measurement.showDistances && !measurement.showArea && measurement.showAngles) {
			return `${Potree.resourcePath}/icons/angle.png`;
		} else if (measurement.showHeight) {
			return `${Potree.resourcePath}/icons/height.svg`;
		} else {
			return `${Potree.resourcePath}/icons/distance.svg`;
		}
	} else if (measurement instanceof Potree.Profile) {
		return `${Potree.resourcePath}/icons/profile.svg`;
	} else if (measurement instanceof Potree.Volume) {
		return `${Potree.resourcePath}/icons/volume.svg`;
	} else if (measurement instanceof Potree.PolygonClipVolume) {
		return `${Potree.resourcePath}/icons/clip-polygon.svg`;
	}
};

Potree.Points = class Points {
	constructor () {
		this.boundingBox = new THREE.Box3();
		this.numPoints = 0;
		this.data = {};
	}

	add (points) {
		let currentSize = this.numPoints;
		let additionalSize = points.numPoints;
		let newSize = currentSize + additionalSize;

		let thisAttributes = Object.keys(this.data);
		let otherAttributes = Object.keys(points.data);
		let attributes = new Set([...thisAttributes, ...otherAttributes]);

		for (let attribute of attributes) {
			if (thisAttributes.includes(attribute) && otherAttributes.includes(attribute)) {
				// attribute in both, merge
				let Type = this.data[attribute].constructor;
				let merged = new Type(this.data[attribute].length + points.data[attribute].length);
				merged.set(this.data[attribute], 0);
				merged.set(points.data[attribute], this.data[attribute].length);
				this.data[attribute] = merged;
			} else if (thisAttributes.includes(attribute) && !otherAttributes.includes(attribute)) {
				// attribute only in this; take over this and expand to new size
				let elementsPerPoint = this.data[attribute].length / this.numPoints;
				let Type = this.data[attribute].constructor;
				let expanded = new Type(elementsPerPoint * newSize);
				expanded.set(this.data[attribute], 0);
				this.data[attribute] = expanded;
			} else if (!thisAttributes.includes(attribute) && otherAttributes.includes(attribute)) {
				// attribute only in points to be added; take over new points and expand to new size
				let elementsPerPoint = points.data[attribute].length / points.numPoints;
				let Type = points.data[attribute].constructor;
				let expanded = new Type(elementsPerPoint * newSize);
				expanded.set(points.data[attribute], elementsPerPoint * currentSize);
				this.data[attribute] = expanded;
			}
		}

		this.numPoints = newSize;

		this.boundingBox.union(points.boundingBox);
	}
};

const loadPointCloudDefaultOptions = {
	// Name of point cloud
	name: 'Point Cloud',
	// Number of point clouds to clone. This is used in Extractor to display the same point clouds in different views
	numberOfClones: 1,
};

/* eslint-disable standard/no-callback-literal */
Potree.loadPointCloud = function (path, options = loadPointCloudDefaultOptions, callback) {
	let loaded = function (pointclouds) {
		pointclouds[0].name = options.name;
		callback({ type: 'pointcloud_loaded', pointclouds });
	};

	// Empty array used in map function to create clones
	const arrayToMap = new Array((options.numberOfClones || 0) + 1).fill();

	// load pointcloud
	if (!path) {
		// TODO: callback? comment? Hello? Bueller? Anyone?
	} else if (path.indexOf('ept.json') > 0) {
		Potree.EptLoader.load(path, function(geometry) {
			if (!geometry) {
				console.error(new Error(`failed to load point cloud from URL: ${path}`));
			} else {
				const pointClouds = arrayToMap.map(() => new Potree.PointCloudOctree(geometry));
				loaded(pointClouds);
			}
		});
	} else if (path.indexOf('greyhound://') === 0) {
		// We check if the path string starts with 'greyhound:', if so we assume it's a greyhound server URL.
		Potree.GreyhoundLoader.load(path, function (geometry) {
			if (!geometry) {
				callback({type: 'loading_failed'});
			} else {
				const pointClouds = arrayToMap.map(() => new Potree.PointCloudOctree(geometry));
				loaded(pointClouds);
			}
		});
	} else if (path.indexOf('cloud.js') > 0) {
		Potree.POCLoader.load(path, function (geometry) {
			if (!geometry) {
				callback({type: 'loading_failed'});
			} else {
				const pointClouds = arrayToMap.map(() => new Potree.PointCloudOctree(geometry));
				loaded(pointClouds);
			}
		});
	} else if (path.indexOf('.vpc') > 0) {
		Potree.PointCloudArena4DGeometry.load(path, function (geometry) {
			if (!geometry) {
				callback({type: 'loading_failed'});
			} else {
				const pointClouds = arrayToMap.map(() => new Potree.PointCloudOctree(geometry));
				loaded(pointClouds);
			}
		});
	} else {
		//callback({'type': 'loading_failed'});
		console.error(new Error(`failed to load point cloud from URL: ${path}`));
	}
};
/* eslint-enable standard/no-callback-literal */

Potree.updatePointClouds = function (pointclouds, camera, renderer) {
	if (!Potree.lru) {
		Potree.lru = new LRU();
	}

	for (let pointcloud of pointclouds) {
		let start = performance.now();

		for (let profileRequest of pointcloud.profileRequests) {
			profileRequest.update();

			let duration = performance.now() - start;
			if(duration > 5){
				break;
			}
		}

		let duration = performance.now() - start;
	}

	let result = Potree.updateVisibility(pointclouds, camera, renderer);

	for (let pointcloud of pointclouds) {
		pointcloud.updateMaterial(pointcloud.material, pointcloud.visibleNodes, camera, renderer);
		pointcloud.updateVisibleBounds();
	}

	Potree.getLRU().freeMemory();

	return result;
};

Potree.getLRU = function () {
	if (!Potree.lru) {
		Potree.lru = new LRU();
	}

	return Potree.lru;
};

Potree.updateVisibilityStructures = function(pointclouds, cameras, renderers) {
	let frustums = [];
	let camObjPositions = [];
	let priorityQueue = new BinaryHeap(function (x) { return 1 / x.weight; });

	for (let i = 0; i < pointclouds.length; i++) {
		const pointcloud = pointclouds[i];
		const camera = cameras[i];

		if (!pointcloud.initialized()) {
			continue;
		}

		pointcloud.numVisibleNodes = 0;
		pointcloud.numVisiblePoints = 0;
		pointcloud.deepestVisibleLevel = 0;
		pointcloud.visibleNodes = [];
		pointcloud.visibleGeometry = [];

		// frustum in object space
		camera.updateMatrixWorld();
		let frustum = new THREE.Frustum();
		let viewI = camera.matrixWorldInverse;
		let world = pointcloud.matrixWorld;
		
		// use close near plane for frustum intersection
		let frustumCam = camera.clone();
		frustumCam.near = Math.min(camera.near, 0.1);
		frustumCam.updateProjectionMatrix();
		let proj = camera.projectionMatrix;

		let fm = new THREE.Matrix4().multiply(proj).multiply(viewI).multiply(world);
		frustum.setFromMatrix(fm);
		frustums.push(frustum);

		// camera position in object space
		let view = camera.matrixWorld;
		let worldI = new THREE.Matrix4().getInverse(world);
		let camMatrixObject = new THREE.Matrix4().multiply(worldI).multiply(view);
		let camObjPos = new THREE.Vector3().setFromMatrixPosition(camMatrixObject);
		camObjPositions.push(camObjPos);

		if (pointcloud.visible && pointcloud.root !== null) {
			priorityQueue.push({pointcloud: i, node: pointcloud.root, weight: Number.MAX_VALUE});
		}

		// hide all previously visible nodes
		if (pointcloud.root.isTreeNode()) {
			pointcloud.hideDescendants(pointcloud.root.sceneNode);
		}

		for (let j = 0; j < pointcloud.boundingBoxNodes.length; j++) {
			pointcloud.boundingBoxNodes[j].visible = false;
		}
	}

	return {
		'frustums': frustums,
		'camObjPositions': camObjPositions,
		'priorityQueue': priorityQueue
	};
};

Potree.getDEMWorkerInstance = function () {
	if (!Potree.DEMWorkerInstance) {
		let workerPath = Potree.scriptPath + '/workers/DEMWorker.js';
		Potree.DEMWorkerInstance = Potree.workerPool.getWorker(workerPath);
	}

	return Potree.DEMWorkerInstance;
};


Potree.updateVisibility = function(pointclouds, cameras, renderers){
	const [camera] = cameras;
	const [renderer] = renderers;

	// check if pointcloud has been transformed
	// some code will only be executed if changes have been detected
	if(!Potree._pointcloudTransformVersion){
		Potree._pointcloudTransformVersion = new Map();
	}
	let pointcloudTransformVersion = Potree._pointcloudTransformVersion;
	for(let pointcloud of pointclouds){

		if(!pointcloud.visible){
			continue;
		}

		pointcloud.updateMatrixWorld();

		if(!pointcloudTransformVersion.has(pointcloud)){
			pointcloudTransformVersion.set(pointcloud, {number: 0, transform: pointcloud.matrixWorld.clone()});
		}else{
			let version = pointcloudTransformVersion.get(pointcloud);

			if(!version.transform.equals(pointcloud.matrixWorld)){
				version.number++;
				version.transform.copy(pointcloud.matrixWorld);

				pointcloud.dispatchEvent({
					type: "transformation_changed",
					target: pointcloud
				});
			}
		}
	}

	let numVisibleNodes = 0;
	let numVisiblePoints = 0;

	let numVisiblePointsInPointclouds = new Map(pointclouds.map(pc => [pc, 0]));

	let visibleNodes = [];
	let visibleGeometry = [];
	let unloadedGeometry = [];

	let lowestSpacing = Infinity;	
	
	let s = Potree.updateVisibilityStructures(pointclouds, cameras, renderers);
	let frustums = s.frustums;
	let camObjPositions = s.camObjPositions;
	let priorityQueue = s.priorityQueue;

	let loadedToGPUThisFrame = 0;
	
	let domWidth = renderer.domElement.clientWidth;
	let domHeight = renderer.domElement.clientHeight;

	while (priorityQueue.size() > 0) {
		let element = priorityQueue.pop();
		let node = element.node;
		let parent = element.parent;
		let pointcloud = pointclouds[element.pointcloud];

		// { // restrict to certain nodes for debugging
		//	let allowedNodes = ["r", "r0", "r4"];
		//	if(!allowedNodes.includes(node.name)){
		//		continue;
		//	}
		// }

		let box = node.getBoundingBox();

		let insideFrustum = frustums.some(x => x.intersectsBox(box));
		let maxLevel = pointcloud.maxLevel || Infinity;
		let level = node.getLevel();
		let visible = insideFrustum;
		visible = visible && !(numVisiblePoints + node.getNumPoints() > Potree.pointBudget);
		visible = visible && !(numVisiblePointsInPointclouds.get(pointcloud) + node.getNumPoints() > pointcloud.pointBudget);
		visible = visible && level < maxLevel;


		if(!window.warned125){
			// TODO
			window.warned125 = true;
		}

		if(pointcloud.material.clipBoxes.length > 0) {
			let numIntersecting = 0;
			let numIntersectionVolumes = 0;

			// Loop through clip boxes and look for intersections with current node
			for(let clipBox of pointcloud.material.clipBoxes){
				let pcWorldInverse = new THREE.Matrix4().getInverse(pointcloud.matrixWorld);
				let toPCObject = pcWorldInverse.multiply(clipBox.box.matrixWorld);

				let px = new THREE.Vector3(+1, 0, 0).applyMatrix4(toPCObject);
				let nx = new THREE.Vector3(-1, 0, 0).applyMatrix4(toPCObject);
				let py = new THREE.Vector3(0, +1, 0).applyMatrix4(toPCObject);
				let ny = new THREE.Vector3(0, -1, 0).applyMatrix4(toPCObject);
				let pz = new THREE.Vector3(0, 0, +1).applyMatrix4(toPCObject);
				let nz = new THREE.Vector3(0, 0, -1).applyMatrix4(toPCObject);

				let pxN = new THREE.Vector3().subVectors(nx, px).normalize();
				let nxN = pxN.clone().multiplyScalar(-1);
				let pyN = new THREE.Vector3().subVectors(ny, py).normalize();
				let nyN = pyN.clone().multiplyScalar(-1);
				let pzN = new THREE.Vector3().subVectors(nz, pz).normalize();
				let nzN = pzN.clone().multiplyScalar(-1);

				let pxPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(pxN, px);
				let nxPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(nxN, nx);
				let pyPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(pyN, py);
				let nyPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(nyN, ny);
				let pzPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(pzN, pz);
				let nzPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(nzN, nz);

				let frustum = new THREE.Frustum(pxPlane, nxPlane, pyPlane, nyPlane, pzPlane, nzPlane);
				let intersects = frustum.intersectsBox(box);

				if(intersects){
					numIntersecting++;
				}
				numIntersectionVolumes++;
			}

			let insideAny = numIntersecting > 0;
			let insideAll = numIntersecting === numIntersectionVolumes;

			// There are other clip tasks but we are not using them (highlight and show_outside).
			if(pointcloud.material.clipTask === Potree.ClipTask.SHOW_INSIDE) {
				if (
					// Check if the node is outside the crop plane and turn off visibility for them
					!(pointcloud.material.clipMethod === Potree.ClipMethod.INSIDE_ANY && insideAny) &&
					!(pointcloud.material.clipMethod === Potree.ClipMethod.INSIDE_ALL && insideAll)
				) {
					visible = false;
				}
			}
		}

		if (node.spacing) {
			lowestSpacing = Math.min(lowestSpacing, node.spacing);
		} else if (node.geometryNode && node.geometryNode.spacing) {
			lowestSpacing = Math.min(lowestSpacing, node.geometryNode.spacing);
		}

		if (numVisiblePoints + node.getNumPoints() > Potree.pointBudget) {
			break;
		}

		if (!visible) {
			continue;
		}

		// TODO: not used, same as the declaration?
		// numVisibleNodes++;
		numVisiblePoints += node.getNumPoints();
		let numVisiblePointsInPointcloud = numVisiblePointsInPointclouds.get(pointcloud);
		numVisiblePointsInPointclouds.set(pointcloud, numVisiblePointsInPointcloud + node.getNumPoints());

		pointcloud.numVisibleNodes++;
		pointcloud.numVisiblePoints += node.getNumPoints();

		if (node.isGeometryNode() && (!parent || parent.isTreeNode())) {
			if (node.isLoaded() && loadedToGPUThisFrame < 2) {
				node = pointcloud.toTreeNode(node, parent);
				loadedToGPUThisFrame++;
			} else {
				unloadedGeometry.push(node);
				visibleGeometry.push(node);
			}
		}

		if (node.isTreeNode()) {
			if (!pointcloud.initialLoadFinished) {
				pointcloud.initialLoadFinished = true;
				pointcloud.dispatchEvent({ type: 'pointcloud_ready' });
			}

			Potree.getLRU().touch(node.geometryNode);
			node.sceneNode.visible = true;
			node.sceneNode.material = pointcloud.material;

			visibleNodes.push(node);
			pointcloud.visibleNodes.push(node);

			if(node._transformVersion === undefined){
				node._transformVersion = -1;
			}
			let transformVersion = pointcloudTransformVersion.get(pointcloud);
			if(node._transformVersion !== transformVersion.number){
				node.sceneNode.updateMatrix();
				node.sceneNode.matrixWorld.multiplyMatrices(pointcloud.matrixWorld, node.sceneNode.matrix);	
				node._transformVersion = transformVersion.number;
			}

			if (pointcloud.showBoundingBox && !node.boundingBoxNode && node.getBoundingBox) {
				let boxHelper = new Potree.Box3Helper(node.getBoundingBox());
				boxHelper.matrixAutoUpdate = false;
				pointcloud.boundingBoxNodes.push(boxHelper);
				node.boundingBoxNode = boxHelper;
				node.boundingBoxNode.matrix.copy(pointcloud.matrixWorld);
			} else if (pointcloud.showBoundingBox) {
				node.boundingBoxNode.visible = true;
				node.boundingBoxNode.matrix.copy(pointcloud.matrixWorld);
			} else if (!pointcloud.showBoundingBox && node.boundingBoxNode) {
				node.boundingBoxNode.visible = false;
			}
		}

		// add child nodes to priorityQueue
		let children = node.getChildren();
		for (let i = 0; i < children.length; i++) {
			let child = children[i];

			let weight = 0; 
			if(camera.isPerspectiveCamera){
				let sphere = child.getBoundingSphere();
				let center = sphere.center;
				
				const distances = camObjPositions.map((pos, i) => {
					let dx = pos.x - center.x;
					let dy = pos.y - center.y;
					let dz = pos.z - center.z;
					
					let dd = dx * dx + dy * dy + dz * dz;
					const dist = Math.sqrt(dd);

					return dist;
				});
				
				const distance = Math.min(...distances);

				let radius = sphere.radius;
				
				let fov = (camera.fov * Math.PI) / 180;
				let slope = Math.tan(fov / 2);
				let projFactor = (0.5 * domHeight) / (slope * distance);
				let screenPixelRadius = radius * projFactor;
				
				if(screenPixelRadius < pointcloud.minimumNodePixelSize){
					continue;
				}
			
				weight = screenPixelRadius;

				if(distance - radius < 0){
					weight = Number.MAX_VALUE;
				}
			} else {
				// TODO ortho visibility
				let bb = child.getBoundingBox();
				const distances = camObjPositions.map(pos => child.getBoundingSphere().center.distanceTo(pos));
				let diagonal = bb.max.clone().sub(bb.min).length();
				const distance = Math.min(...distances);
				weight = diagonal / distance;
			}

			priorityQueue.push({pointcloud: element.pointcloud, node: child, parent: node, weight: weight});
		}
	}// end priority queue loop

	{ // update DEM
		let maxDEMLevel = 4;
		let candidates = pointclouds
			.filter(p => (p.generateDEM && p.dem instanceof Potree.DEM));
		for (let pointcloud of candidates) {
			let updatingNodes = pointcloud.visibleNodes.filter(n => n.getLevel() <= maxDEMLevel);
			pointcloud.dem.update(updatingNodes);
		}
	}

	for (let i = 0; i < Math.min(Potree.maxNodesLoading, unloadedGeometry.length); i++) {
		unloadedGeometry[i].load();
	}

	return {
		visibleNodes: visibleNodes,
		numVisiblePoints: numVisiblePoints,
		lowestSpacing: lowestSpacing
	};
};

Potree.XHRFactory = {
	config: {
		withCredentials: false,
		customHeaders: [
			{ header: null, value: null }
		]
	},

	createXMLHttpRequest: function () {
		let xhr = new XMLHttpRequest();

		if (this.config.customHeaders &&
			Array.isArray(this.config.customHeaders) &&
			this.config.customHeaders.length > 0) {
			let baseOpen = xhr.open;
			let customHeaders = this.config.customHeaders;
			xhr.open = function () {
				baseOpen.apply(this, [].slice.call(arguments));
				customHeaders.forEach(function (customHeader) {
					if (!!customHeader.header && !!customHeader.value) {
						xhr.setRequestHeader(customHeader.header, customHeader.value);
					}
				});
			};
		}

		return xhr;
	}
};

Potree.getSignatureKeyForPath = (path) => {
	if (!Potree.signedUrls) {
		return '';
	}

	let key;
	for (let e in Potree.signedUrls.urls) {
		if (e.indexOf(path) >= 0) {
			key = Potree.signedUrls.urls[e];
		}
	}
	return `?Expires=${Potree.signedUrls.expires}&KeyName=${Potree.signedUrls.keyname}&Signature=${key}`;
};

export default Potree;
