

export * from "./Actions.js";
export * from "./AnimationPath.js";
export * from "./Annotation.js";
export * from "./defines.js";
export * from "./Enum.js";
export * from "./EventDispatcher.js";
export * from "./Features.js";
export * from "./KeyCodes.js";
export * from "./LRU.js";
export * from "./PointCloud.js";
export * from "./PointCloudGreyhoundGeometry.js";
export * from "./PointCloudGreyhoundGeometryNode.js";
export * from "./PointCloudOctree.js";
export * from "./PointCloudOctreeGeometry.js";
export * from "./PointCloudTree.js";
export * from "./Points.js";
export * from "./Potree_update_visibility.js";
export * from "./PotreeRenderer.js";
export * from "./ProfileRequest.js";
export * from "./TextSprite.js";
export * from "./utils.js";
export * from "./Version.js";
export * from "./WorkerPool.js";
export * from "./XHRFactory.js";

export * from "./materials/EyeDomeLightingMaterial.js";
export * from "./materials/Gradients.js";
export * from "./materials/NormalizationEDLMaterial.js";
export * from "./materials/NormalizationMaterial.js";
export * from "./materials/PointCloudMaterial.js";

export * from "./loader/POCLoader.js";
export * from "./loader/PointAttributes.js";

export * from "./utils/Box3Helper.js";
export * from "./utils/ClippingTool.js";
export * from "./utils/ClipVolume.js";
export * from "./utils/GeoTIFF.js";
export * from "./utils/Measure.js";
export * from "./utils/MeasuringTool.js";
export * from "./utils/Message.js";
export * from "./utils/PointCloudSM.js";
export * from "./utils/PolygonClipVolume.js";
export * from "./utils/Profile.js";
export * from "./utils/ProfileTool.js";
export * from "./utils/ScreenBoxSelectTool.js";
export * from "./utils/SpotLightHelper.js";
export * from "./utils/toInterleavedBufferAttribute.js";
export * from "./utils/TransformationTool.js";
export * from "./utils/Volume.js";
export * from "./utils/VolumeTool.js";

export * from "./viewer/viewer.js";
export * from "./viewer/Scene.js";

import "./extensions/OrthographicCamera.js";
import "./extensions/PerspectiveCamera.js";
import "./extensions/Ray.js";

import {PointColorType} from "./defines.js";
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



(function($){
	$.fn.extend({
		selectgroup: function(args = {}){

			let elGroup = $(this);
			let rootID = elGroup.prop("id");
			let groupID = `${rootID}`;
			let groupTitle = (args.title !== undefined) ? args.title : "";

			let elButtons = [];
			elGroup.find("option").each((index, value) => {
				let buttonID = $(value).prop("id");
				let label = $(value).html();
				let optionValue = $(value).prop("value");

				let elButton = $(`
					<span style="flex-grow: 1; display: inherit">
					<label for="${buttonID}" class="ui-button" style="width: 100%; padding: .4em .1em">${label}</label>
					<input type="radio" name="${groupID}" id="${buttonID}" value="${optionValue}" style="display: none"/>
					</span>
				`);
				let elLabel = elButton.find("label");
				let elInput = elButton.find("input");

				elInput.change( () => {
					elGroup.find("label").removeClass("ui-state-active");
					elGroup.find("label").addClass("ui-state-default");
					if(elInput.is(":checked")){
						elLabel.addClass("ui-state-active");
					}else{
						//elLabel.addClass("ui-state-default");
					}
				});

				elButtons.push(elButton);
			});

			let elFieldset = $(`
				<fieldset style="border: none; margin: 0px; padding: 0px">
					<legend>${groupTitle}</legend>
					<span style="display: flex">

					</span>
				</fieldset>
			`);

			let elButtonContainer = elFieldset.find("span");
			for(let elButton of elButtons){
				elButtonContainer.append(elButton);
			}

			elButtonContainer.find("label").each( (index, value) => {
				$(value).css("margin", "0px");
				$(value).css("border-radius", "0px");
				$(value).css("border", "1px solid black");
				$(value).css("border-left", "none");
			});
			elButtonContainer.find("label:first").each( (index, value) => {
				$(value).css("border-radius", "4px 0px 0px 4px");
				
			});
			elButtonContainer.find("label:last").each( (index, value) => {
				$(value).css("border-radius", "0px 4px 4px 0px");
				$(value).css("border-left", "none");
			});

			elGroup.empty();
			elGroup.append(elFieldset);



		}
	});
})(jQuery);



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
