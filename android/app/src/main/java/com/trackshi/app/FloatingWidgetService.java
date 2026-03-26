package com.trackshi.app;

import android.app.Service;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.os.Build;
import android.os.IBinder;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.LinearLayout;
import android.widget.TextView;

public class FloatingWidgetService extends Service {

    private WindowManager mWindowManager;
    private View mFloatingWidget;

    public FloatingWidgetService() {
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            String timerText = intent.getStringExtra("timerText");
            if (mFloatingWidget != null) {
                TextView timerView = mFloatingWidget.findViewById(1001);
                if (timerText != null) timerView.setText(timerText);
            }
        }
        return START_STICKY;
    }

    @Override
    public void onCreate() {
        super.onCreate();

        // Create the floating view programmatically
        mFloatingWidget = new LinearLayout(this);
        LinearLayout layout = (LinearLayout) mFloatingWidget;
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setGravity(Gravity.CENTER);
        
        // Small circular background
        android.graphics.drawable.GradientDrawable shape = new android.graphics.drawable.GradientDrawable();
        shape.setShape(android.graphics.drawable.GradientDrawable.OVAL);
        shape.setColor(Color.parseColor("#FF5500"));
        layout.setBackground(shape);

        // Small "T" or Timer text
        TextView timerView = new TextView(this);
        timerView.setId(1001);
        timerView.setText("T");
        timerView.setTextColor(Color.BLACK);
        timerView.setTextSize(18);
        timerView.setTypeface(null, android.graphics.Typeface.BOLD);
        layout.addView(timerView);

        int layoutFlag;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            layoutFlag = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY;
        } else {
            layoutFlag = WindowManager.LayoutParams.TYPE_PHONE;
        }

        // Set size to 60dp x 60dp
        int size = (int) (60 * getResources().getDisplayMetrics().density);
        final WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                size,
                size,
                layoutFlag,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
                PixelFormat.TRANSLUCENT);

        params.gravity = Gravity.TOP | Gravity.LEFT;
        params.x = 0;
        params.y = 100;

        mWindowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
        mWindowManager.addView(mFloatingWidget, params);

        // Drag and click logic
        mFloatingWidget.setOnTouchListener(new View.OnTouchListener() {
            private int initialX;
            private int initialY;
            private float initialTouchX;
            private float initialTouchY;
            private long lastTouchDownTime;
            private static final int CLICK_THRESHOLD = 200; // ms

            @Override
            public boolean onTouch(View v, MotionEvent event) {
                switch (event.getAction()) {
                    case MotionEvent.ACTION_DOWN:
                        lastTouchDownTime = System.currentTimeMillis();
                        initialX = params.x;
                        initialY = params.y;
                        initialTouchX = event.getRawX();
                        initialTouchY = event.getRawY();
                        return true;
                    case MotionEvent.ACTION_UP:
                        // If it was a quick tap, open the app
                        if (System.currentTimeMillis() - lastTouchDownTime < CLICK_THRESHOLD) {
                            Intent intent = new Intent(FloatingWidgetService.this, MainActivity.class);
                            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                            startActivity(intent);
                        }
                        return true;
                    case MotionEvent.ACTION_MOVE:
                        params.x = initialX + (int) (event.getRawX() - initialTouchX);
                        params.y = initialY + (int) (event.getRawY() - initialTouchY);
                        mWindowManager.updateViewLayout(mFloatingWidget, params);
                        return true;
                }
                return false;
            }
        });
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (mFloatingWidget != null) {
            mWindowManager.removeView(mFloatingWidget);
        }
    }
}
