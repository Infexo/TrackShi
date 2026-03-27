// FloatingWidgetService.java — Replace your entire class with this instrumented version

package com.yourapp.plugins;

import android.app.*;
import android.content.*;
import android.graphics.*;
import android.os.*;
import android.provider.Settings;
import android.util.Log;
import android.view.*;
import android.widget.*;
import androidx.core.app.NotificationCompat;

public class FloatingWidgetService extends Service {

    private static final String TAG = "FloatingWidget"; // ← Our logcat filter
    private static final String CHANNEL_ID = "floating_widget_channel";
    private static final int NOTIFICATION_ID = 1001;

    private WindowManager mWindowManager;
    private View mFloatingView;

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "═══════════════════════════════════════");
        Log.d(TAG, "SERVICE onCreate() CALLED");
        Log.d(TAG, "Android API Level: " + Build.VERSION.SDK_INT);
        Log.d(TAG, "Can draw overlays: " + Settings.canDrawOverlays(this));

        try {
            createNotificationChannel();
            Log.d(TAG, "Notification channel created");

            Notification notification = buildNotification("00:00", "Studying");
            Log.d(TAG, "Notification built: " + (notification != null));

            startForeground(NOTIFICATION_ID, notification);
            Log.d(TAG, "startForeground() SUCCEEDED");
        } catch (Exception e) {
            Log.e(TAG, "startForeground() FAILED: " + e.getClass().getSimpleName());
            Log.e(TAG, "Message: " + e.getMessage());
            e.printStackTrace();
            return; // ← Don't try to create widget if foreground failed
        }

        try {
            createFloatingWidget();
        } catch (Exception e) {
            Log.e(TAG, "createFloatingWidget() FAILED: " + e.getClass().getSimpleName());
            Log.e(TAG, "Message: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void createFloatingWidget() {
        Log.d(TAG, "createFloatingWidget() ENTER");

        // CHECK 1: Overlay permission (again, from service context)
        if (!Settings.canDrawOverlays(this)) {
            Log.e(TAG, "FATAL: canDrawOverlays=FALSE from service context!");
            return;
        }

        // CHECK 2: Get WindowManager
        mWindowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
        if (mWindowManager == null) {
            Log.e(TAG, "FATAL: WindowManager is NULL");
            return;
        }
        Log.d(TAG, "WindowManager obtained: " + mWindowManager);

        // CHECK 3: Get display metrics to verify size calculation
        DisplayMetrics metrics = new DisplayMetrics();
        mWindowManager.getDefaultDisplay().getMetrics(metrics);
        float density = metrics.density;
        int size = (int) (60 * density);
        Log.d(TAG, "Display density: " + density);
        Log.d(TAG, "Widget size in px: " + size);
        Log.d(TAG, "Screen: " + metrics.widthPixels + "x" + metrics.heightPixels);

        // CHECK 4: Build the view
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setGravity(Gravity.CENTER);

        // Use a GradientDrawable for the circular background
        android.graphics.drawable.GradientDrawable circle =
                new android.graphics.drawable.GradientDrawable();
        circle.setShape(android.graphics.drawable.GradientDrawable.OVAL);
        circle.setColor(Color.parseColor("#FF6B00")); // Orange
        layout.setBackground(circle);

        TextView timerText = new TextView(this);
        timerText.setText("00:00");
        timerText.setTextColor(Color.WHITE);
        timerText.setTextSize(12);
        timerText.setGravity(Gravity.CENTER);
        layout.addView(timerText);

        mFloatingView = layout;
        Log.d(TAG, "View built. View is null? " + (mFloatingView == null));

        // CHECK 5: Build layout params
        int layoutFlag;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            layoutFlag = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY;
            Log.d(TAG, "Using TYPE_APPLICATION_OVERLAY");
        } else {
            layoutFlag = WindowManager.LayoutParams.TYPE_PHONE;
            Log.d(TAG, "Using TYPE_PHONE (legacy)");
        }

        final WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                size,
                size,
                layoutFlag,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
                PixelFormat.TRANSLUCENT);

        params.gravity = Gravity.TOP | Gravity.START;
        params.x = 100;
        params.y = 300;

        Log.d(TAG, "LayoutParams: width=" + params.width +
                " height=" + params.height +
                " type=" + params.type +
                " flags=" + params.flags +
                " x=" + params.x + " y=" + params.y);

        // CHECK 6: Add the view
        try {
            mWindowManager.addView(mFloatingView, params);
            Log.d(TAG, "addView() SUCCEEDED ✓");

            // Verify the view is actually attached
            Log.d(TAG, "View isAttachedToWindow: " +
                    mFloatingView.isAttachedToWindow());
            Log.d(TAG, "View visibility: " + mFloatingView.getVisibility() +
                    " (0=VISIBLE, 4=INVISIBLE, 8=GONE)");
            Log.d(TAG, "View dimensions: " +
                    mFloatingView.getWidth() + "x" + mFloatingView.getHeight());

            // Post a delayed check to verify after layout pass
            mFloatingView.post(() -> {
                Log.d(TAG, "POST-LAYOUT CHECK:");
                Log.d(TAG, "  isAttachedToWindow: " + mFloatingView.isAttachedToWindow());
                Log.d(TAG, "  dimensions: " +
                        mFloatingView.getWidth() + "x" + mFloatingView.getHeight());
                Log.d(TAG, "  visibility: " + mFloatingView.getVisibility());
                int[] location = new int[2];
                mFloatingView.getLocationOnScreen(location);
                Log.d(TAG, "  position on screen: " +
                        location[0] + ", " + location[1]);
            });

        } catch (WindowManager.BadTokenException e) {
            Log.e(TAG, "addView() FAILED — BadTokenException: " + e.getMessage());
        } catch (SecurityException e) {
            Log.e(TAG, "addView() FAILED — SecurityException: " + e.getMessage());
        } catch (Exception e) {
            Log.e(TAG, "addView() FAILED — " +
                    e.getClass().getSimpleName() + ": " + e.getMessage());
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Floating Timer Widget",
                    NotificationManager.IMPORTANCE_LOW // LOW = no sound, shows in tray
            );
            channel.setDescription("Shows the floating timer overlay");

            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
                Log.d(TAG, "Channel created. Channel importance: " +
                        channel.getImportance());
            } else {
                Log.e(TAG, "NotificationManager is NULL!");
            }
        }
    }

    private Notification buildNotification(String time, String status) {
        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Timer: " + time)
                .setContentText(status)
                .setSmallIcon(android.R.drawable.ic_media_play) // Use a guaranteed icon
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .build();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "onStartCommand() called");
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        Log.d(TAG, "SERVICE onDestroy() CALLED");
        if (mFloatingView != null && mWindowManager != null) {
            try {
                mWindowManager.removeView(mFloatingView);
                Log.d(TAG, "View removed successfully");
            } catch (Exception e) {
                Log.e(TAG, "Error removing view: " + e.getMessage());
            }
        }
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
