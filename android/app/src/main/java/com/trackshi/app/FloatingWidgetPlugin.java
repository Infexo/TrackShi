// FloatingWidgetPlugin.java

package com.yourapp.plugins;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "FloatingWidget")
public class FloatingWidgetPlugin extends Plugin {

    private static final String TAG = "FloatingWidget";

    @PluginMethod()
    public void startWidget(PluginCall call) {
        Context context = getContext();
        Log.d(TAG, "════════════════════════════════════════");
        Log.d(TAG, "startWidget() CALLED FROM CAPACITOR");
        Log.d(TAG, "Context type: " + context.getClass().getSimpleName());

        // CHECK 1: Overlay permission
        boolean canDraw = Settings.canDrawOverlays(context);
        Log.d(TAG, "canDrawOverlays: " + canDraw);

        if (!canDraw) {
            Log.e(TAG, "OVERLAY PERMISSION NOT GRANTED — opening settings");
            Intent intent = new Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:" + context.getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
            call.reject("Overlay permission not granted");
            return;
        }

        // CHECK 2: Start the service
        try {
            Intent serviceIntent = new Intent(context, FloatingWidgetService.class);
            Log.d(TAG, "Service intent created for: " +
                    FloatingWidgetService.class.getName());

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                Log.d(TAG, "Using startForegroundService()");
                context.startForegroundService(serviceIntent);
            } else {
                Log.d(TAG, "Using startService()");
                context.startService(serviceIntent);
            }

            Log.d(TAG, "Service start command issued ✓");
            call.resolve(new JSObject().put("status", "started"));

        } catch (Exception e) {
            Log.e(TAG, "FAILED to start service: " +
                    e.getClass().getSimpleName() + ": " + e.getMessage());
            e.printStackTrace();
            call.reject("Failed to start service: " + e.getMessage());
        }
    }

    @PluginMethod()
    public void stopWidget(PluginCall call) {
        Log.d(TAG, "stopWidget() CALLED");
        Context context = getContext();
        context.stopService(new Intent(context, FloatingWidgetService.class));
        call.resolve(new JSObject().put("status", "stopped"));
    }

    @PluginMethod()
    public void checkPermission(PluginCall call) {
        boolean canDraw = Settings.canDrawOverlays(getContext());
        Log.d(TAG, "checkPermission: canDrawOverlays=" + canDraw);
        call.resolve(new JSObject().put("granted", canDraw));
    }
}
