

export {PointCloudMaterial} from "./materials/PointCloudMaterial.js";
export * from "./Enum.js";
export * from "./PointCloudOctreeGeometry.js";
export * from "./PointCloudOctree.js";
export * from "./Potree_update_visibility.js";
export * from "./defines.js";
export * from "./loader/POCLoader.js";
export * from "./loader/PointAttributes.js";
export * from "./viewer/viewer.js";


import {PointColorType} from "./materials/PointCloudMaterial.js";
import {Enum} from "./Enum.js";
import {LRU} from "./LRU.js";
import {POCLoader} from "./loader/POCLoader.js";
import {PointCloudOctree} from "./PointCloudOctree.js";
import {WorkerPool} from "./WorkerPool.js";

export const workerPool = new WorkerPool();

export const version = {
	major: 1,
	minor: 6,
	suffix: ''
};

export let lru = new LRU();

console.log('Potree ' + version.major + '.' + version.minor + version.suffix);

export let pointBudget = 1 * 1000 * 1000;
export let framenumber = 0;
export let numNodesLoading = 0;
export let maxNodesLoading = 4;

export const debug = {};

let scriptPath = "";
if (document.currentScript.src) {
	scriptPath = new URL(document.currentScript.src + '/..').href;
	if (scriptPath.slice(-1) === '/') {
		scriptPath = scriptPath.slice(0, -1);
	}
} else {
	console.error('Potree was unable to find its script path using document.currentScript. Is Potree included with a script tag? Does your browser support this function?');
}
// HELIX RE
//removeIf(development)
scriptPath = '/pointcloud-viewer/libs/potree/';
//endRemoveIf(development)
// end HELIX RE

let resourcePath = scriptPath + '/resources';

export {scriptPath, resourcePath};


// TODO check if this can be removed or improved
export function toMaterialID(materialName){
	if (materialName === 'RGB'){
		return PointColorType.RGB;
	} else if (materialName === 'Color') {
		return PointColorType.COLOR;
	} else if (materialName === 'Elevation') {
		return PointColorType.HEIGHT;
	} else if (materialName === 'Intensity') {
		return PointColorType.INTENSITY;
	} else if (materialName === 'Intensity Gradient') {
		return PointColorType.INTENSITY_GRADIENT;
	} else if (materialName === 'Classification') {
		return PointColorType.CLASSIFICATION;
	} else if (materialName === 'Return Number') {
		return PointColorType.RETURN_NUMBER;
	} else if (materialName === 'Source') {
		return PointColorType.SOURCE;
	} else if (materialName === 'Level of Detail') {
		return PointColorType.LOD;
	} else if (materialName === 'Point Index') {
		return PointColorType.POINT_INDEX;
	} else if (materialName === 'Normal') {
		return PointColorType.NORMAL;
	} else if (materialName === 'Phong') {
		return PointColorType.PHONG;
	} else if (materialName === 'Index') {
		return PointColorType.POINT_INDEX;
	} else if (materialName === 'RGB and Elevation') {
		return PointColorType.RGB_HEIGHT;
	} else if (materialName === 'Composite') {
		return PointColorType.COMPOSITE;
	}
};


// TODO check if this can be removed or improved
export function toMaterialName(materialID) {
	if (materialID === PointColorType.RGB) {
		return 'RGB';
	} else if (materialID === PointColorType.COLOR) {
		return 'Color';
	} else if (materialID === PointColorType.HEIGHT) {
		return 'Elevation';
	} else if (materialID === PointColorType.INTENSITY) {
		return 'Intensity';
	} else if (materialID === PointColorType.INTENSITY_GRADIENT) {
		return 'Intensity Gradient';
	} else if (materialID === PointColorType.CLASSIFICATION) {
		return 'Classification';
	} else if (materialID === PointColorType.RETURN_NUMBER) {
		return 'Return Number';
	} else if (materialID === PointColorType.SOURCE) {
		return 'Source';
	} else if (materialID === PointColorType.LOD) {
		return 'Level of Detail';
	} else if (materialID === PointColorType.NORMAL) {
		return 'Normal';
	} else if (materialID === PointColorType.PHONG) {
		return 'Phong';
	} else if (materialID === PointColorType.POINT_INDEX) {
		return 'Index';
	} else if (materialID === PointColorType.RGB_HEIGHT) {
		return 'RGB and Elevation';
	} else if (materialID === PointColorType.COMPOSITE) {
		return 'Composite';
	}
};




export function loadPointCloud(path, name, callback){
	let failed = function() {
        callback({ type: 'loading_failed' });
        // console.error(new Error(`failed to load point cloud from URL: ${path}`));
    };

	let loaded = function(pointcloud){
		pointcloud.name = name;
		callback({type: 'pointcloud_loaded', pointcloud: pointcloud});
	};

	// load pointcloud
	if (!path){
		// TODO: callback? comment? Hello? Bueller? Anyone?
	} else if (path.indexOf('entwine.json') > 0) {
        EptLoader.load(path, function(geometry) {
            if (!geometry) {
                failed();
            }
            else {
                let pointcloud = new PointCloudOctree(geometry);
                loaded(pointcloud);
            }
        });
	} else if (path.indexOf('greyhound://') === 0){
		// We check if the path string starts with 'greyhound:', if so we assume it's a greyhound server URL.
		GreyhoundLoader.load(path, function (geometry) {
			if (!geometry) {
				failed();
			} else {
				let pointcloud = new PointCloudOctree(geometry);
				loaded(pointcloud);
			}
		});
	} else if (path.indexOf('cloud.js') > 0) {
		POCLoader.load(path, function (geometry) {
			if (!geometry) {
				failed();
			} else {
				let pointcloud = new PointCloudOctree(geometry);
				loaded(pointcloud);
			}
		});
	} else if (path.indexOf('.vpc') > 0) {
		PointCloudArena4DGeometry.load(path, function (geometry) {
			if (!geometry) {
				failed();
			} else {
				let pointcloud = new PointCloudArena4D(geometry);
				loaded(pointcloud);
			}
		});
	} else {
		failed();
	}
};



//(function($){
//	$.fn.extend({
//		selectgroup: function(args = {}){
//
//			let elGroup = $(this);
//			let rootID = elGroup.prop("id");
//			let groupID = `${rootID}`;
//			let groupTitle = (args.title !== undefined) ? args.title : "";
//
//			let elButtons = [];
//			elGroup.find("option").each((index, value) => {
//				let buttonID = $(value).prop("id");
//				let label = $(value).html();
//				let optionValue = $(value).prop("value");
//
//				let elButton = $(`
//					<span style="flex-grow: 1; display: inherit">
//					<label for="${buttonID}" class="ui-button" style="width: 100%; padding: .4em .1em">${label}</label>
//					<input type="radio" name="${groupID}" id="${buttonID}" value="${optionValue}" style="display: none"/>
//					</span>
//				`);
//				let elLabel = elButton.find("label");
//				let elInput = elButton.find("input");
//
//				elInput.change( () => {
//					elGroup.find("label").removeClass("ui-state-active");
//					elGroup.find("label").addClass("ui-state-default");
//					if(elInput.is(":checked")){
//						elLabel.addClass("ui-state-active");
//					}else{
//						//elLabel.addClass("ui-state-default");
//					}
//				});
//
//				elButtons.push(elButton);
//			});
//
//			let elFieldset = $(`
//				<fieldset style="border: none; margin: 0px; padding: 0px">
//					<legend>${groupTitle}</legend>
//					<span style="display: flex">
//
//					</span>
//				</fieldset>
//			`);
//
//			let elButtonContainer = elFieldset.find("span");
//			for(let elButton of elButtons){
//				elButtonContainer.append(elButton);
//			}
//
//			elButtonContainer.find("label").each( (index, value) => {
//				$(value).css("margin", "0px");
//				$(value).css("border-radius", "0px");
//				$(value).css("border", "1px solid black");
//				$(value).css("border-left", "none");
//			});
//			elButtonContainer.find("label:first").each( (index, value) => {
//				$(value).css("border-radius", "4px 0px 0px 4px");
//				
//			});
//			elButtonContainer.find("label:last").each( (index, value) => {
//				$(value).css("border-radius", "0px 4px 4px 0px");
//				$(value).css("border-left", "none");
//			});
//
//			elGroup.empty();
//			elGroup.append(elFieldset);
//
//
//
//		}
//	});
//})(jQuery);



/*

Potree.Shaders = {};

Potree.webgl = {
	shaders: {},
	vaos: {},
	vbos: {}
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

*/

// HELIX RE
export function getSignatureKeyForPath(path) {
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
}
// end HELIX RE
