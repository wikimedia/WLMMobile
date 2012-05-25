package org.wikipedia.pinchzoom;

import org.apache.cordova.api.Plugin;
import org.apache.cordova.api.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.util.FloatMath;
import android.util.Log;
import android.view.MotionEvent;
import android.view.View;
import android.view.View.OnTouchListener;

public class PinchZoom extends Plugin implements OnTouchListener {

	private String savedCallbackId = null;
	private float zoomInitialDist, zoomFinalDist;
    private boolean zoomActive = false;

    @Override
	public PluginResult execute(String action, JSONArray args, String callbackId) {
    	Log.d("motion", "execute: " + action);
    	if (action.equals("start")) {
    		if (savedCallbackId != null) {
    			return new PluginResult(PluginResult.Status.ERROR, "PinchZoom listener already running");
    		}

    		savedCallbackId = callbackId;
    		webView.setOnTouchListener(this);

    		// No immediate return, we'll call the callback as events come in
    		PluginResult pluginResult = new PluginResult(PluginResult.Status.NO_RESULT);
    		pluginResult.setKeepCallback(true);
    		return pluginResult;
    	} else if (action.equals("stop")) {
    		webView.setOnTouchListener(null);
    		savedCallbackId = null;

    		// Release the callback!
    		PluginResult result = new PluginResult(PluginResult.Status.OK, new JSONObject());
    		result.setKeepCallback(false);
        	success(result, this.savedCallbackId);

    		return new PluginResult(PluginResult.Status.OK);
    	}
		return null;
	}

    @Override
    public boolean onTouch(View v, MotionEvent event) {
        switch (event.getAction() & MotionEvent.ACTION_MASK) {
        case MotionEvent.ACTION_POINTER_DOWN:
        	zoomActive = true;
        	zoomInitialDist = fingerDistance(event);
        	zoomFinalDist = zoomInitialDist;
        	sendUpdate("pinchzoomstart");
        	return true;
        case MotionEvent.ACTION_UP:
        case MotionEvent.ACTION_POINTER_UP:
        	if (zoomActive) {
        		zoomActive = false;
	        	sendUpdate("pinchzoomend");
        		return true;
        	} else {
        		return false;
        	}
        case MotionEvent.ACTION_MOVE:
        	if (zoomActive) {
	        	zoomFinalDist = fingerDistance(event);
	        	sendUpdate("pinchzoommove");
	        	return true;
        	} else {
        		return false;
        	}
        }
        return false;
    }

	private void sendUpdate(String eventType) {
		JSONObject info = new JSONObject();
		try {
			info.put("type", eventType);
			info.put("startDistance", zoomInitialDist);
			info.put("distance", zoomFinalDist);
		} catch (JSONException e) {
			e.printStackTrace();
		}
		PluginResult result = new PluginResult(PluginResult.Status.OK, info);
		result.setKeepCallback(true);
		success(result, this.savedCallbackId);
	}
    
    private float fingerDistance(MotionEvent event) {
    	float dx = event.getX(0) - event.getX(1),
    		dy = event.getY(0) - event.getY(1),
    		dist = FloatMath.sqrt(dx * dx + dy * dy);
    	return dist;
    }
}
