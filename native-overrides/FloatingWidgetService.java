package com.trackshi.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.IBinder;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.core.app.NotificationCompat;

public class FloatingWidgetService extends Service {

    private static final String CHANNEL_ID = "floating_widget_channel";
    private static final int NOTIFICATION_ID = 101;
    private static final int TIMER_VIEW_ID = 1001;

    private WindowManager mWindowManager;
    private View mFloatingWidget;

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onCreate() {
        super.onCreate();

        createNotificationChannel();
        startForeground(NOTIFICATION_ID, buildNotification("00:00", "Studying"));
        createFloatingWidget();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String timerText = "00:00";
        String subjectName = "Studying";

        if (intent != null) {
            String incomingTimer = intent.getStringExtra("timerText");
            String incomingSubject = intent.getStringExtra("subjectName");

            if (incomingTimer != null) {
                timerText = incomingTimer;
            }

            if (incomingSubject != null) {
                subjectName = incomingSubject;
            }
        }

        if (mFloatingWidget != null) {
            TextView timerView = mFloatingWidget.findViewById(TIMER_VIEW_ID);
            if (timerView != null) {
                timerView.setText(timerText);
            }
        }

        NotificationManager nm = getSystemService(NotificationManager.class);
        if (nm != null) {
            nm.notify(NOTIFICATION_ID, buildNotification(timerText, subjectName));
        }

        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (mFloatingWidget != null && mWindowManager != null) {
            try {
                mWindowManager.removeView(mFloatingWidget);
            } catch (Exception ignored) {
            }
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Study Timer",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setShowBadge(false);
            channel.setDescription("Shows while study timer is running");

            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) {
                nm.createNotificationChannel(channel);
            }
        }
    }

    private Notification buildNotification(String timerText, String subjectName) {
        Intent tapIntent = new Intent(this, MainActivity.class);
        tapIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);

        PendingIntent pendingIntent = PendingIntent.getActivity(
                this,
                0,
                tapIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("TrackShi - " + subjectName)
                .setContentText("Timer: " + timerText)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentIntent(pendingIntent)
                .setOngoing(true)
                .setSilent(true)
                .build();
    }

    private void createFloatingWidget() {
        float density = getResources().getDisplayMetrics().density;

        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setGravity(Gravity.CENTER);

        int padding = (int) (4 * density);
        layout.setPadding(padding, padding, padding, padding);

        GradientDrawable shape = new GradientDrawable();
        shape.setShape(GradientDrawable.OVAL);
        shape.setColor(Color.parseColor("#FF5500"));
        layout.setBackground(shape);

        ImageView iconView = new ImageView(this);
        iconView.setImageResource(R.mipmap.ic_launcher_round);
        iconView.setContentDescription("TrackShi");

        int iconSize = (int) (28 * density);
        LinearLayout.LayoutParams iconParams = new LinearLayout.LayoutParams(iconSize, iconSize);
        iconParams.bottomMargin = (int) (2 * density);
        layout.addView(iconView, iconParams);

        TextView timerView = new TextView(this);
        timerView.setId(TIMER_VIEW_ID);
        timerView.setText("00:00");
        timerView.setTextColor(Color.WHITE);
        timerView.setTextSize(10);
        timerView.setTypeface(null, Typeface.BOLD);
        layout.addView(timerView);

        mFloatingWidget = layout;

        int layoutFlag;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            layoutFlag = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY;
        } else {
            layoutFlag = WindowManager.LayoutParams.TYPE_PHONE;
        }

        int size = (int) (60 * density);
        final WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                size,
                size,
                layoutFlag,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
                PixelFormat.TRANSLUCENT
        );

        params.gravity = Gravity.TOP | Gravity.START;
        params.x = 0;
        params.y = 100;

        mWindowManager = (WindowManager) getSystemService(WINDOW_SERVICE);

        try {
            mWindowManager.addView(mFloatingWidget, params);
        } catch (Exception e) {
            stopSelf();
            return;
        }

        final int clickDistPx = (int) (8 * density);

        mFloatingWidget.setOnTouchListener(new View.OnTouchListener() {
            private int initialX;
            private int initialY;
            private float initialTouchX;
            private float initialTouchY;
            private long touchDownTime;

            @Override
            public boolean onTouch(View v, MotionEvent event) {
                switch (event.getAction()) {
                    case MotionEvent.ACTION_DOWN:
                        touchDownTime = System.currentTimeMillis();
                        initialX = params.x;
                        initialY = params.y;
                        initialTouchX = event.getRawX();
                        initialTouchY = event.getRawY();
                        return true;

                    case MotionEvent.ACTION_MOVE:
                        params.x = initialX + (int) (event.getRawX() - initialTouchX);
                        params.y = initialY + (int) (event.getRawY() - initialTouchY);
                        if (mWindowManager != null && mFloatingWidget != null) {
                            mWindowManager.updateViewLayout(mFloatingWidget, params);
                        }
                        return true;

                    case MotionEvent.ACTION_UP:
                        long elapsed = System.currentTimeMillis() - touchDownTime;
                        float dx = event.getRawX() - initialTouchX;
                        float dy = event.getRawY() - initialTouchY;
                        float dist = (float) Math.sqrt(dx * dx + dy * dy);

                        if (elapsed < 200 && dist < clickDistPx) {
                            Intent intent = new Intent(FloatingWidgetService.this, MainActivity.class);
                            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
                            startActivity(intent);
                        }
                        return true;
                }
                return false;
            }
        });
    }
}
