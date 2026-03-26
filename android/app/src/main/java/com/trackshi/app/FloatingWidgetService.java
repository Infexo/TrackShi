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
            String subjectName = intent.getStringExtra("subjectName");
            if (mFloatingWidget != null) {
                TextView timerView = mFloatingWidget.findViewById(1001);
                TextView subjectView = mFloatingWidget.findViewById(1002);
                if (timerText != null) timerView.setText(timerText);
                if (subjectName != null) subjectView.setText(subjectName);
            }
        }
        return START_STICKY;
    }

    @Override
    public void onCreate() {
        super.onCreate();

        // Create the floating view programmatically to avoid needing XML layouts
        mFloatingWidget = new LinearLayout(this);
        LinearLayout layout = (LinearLayout) mFloatingWidget;
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setBackgroundColor(Color.parseColor("#FF5500"));
        layout.setPadding(30, 20, 30, 20);
        layout.setGravity(Gravity.CENTER);
        
        // Add rounded corners programmatically
        android.graphics.drawable.GradientDrawable shape = new android.graphics.drawable.GradientDrawable();
        shape.setShape(android.graphics.drawable.GradientDrawable.RECTANGLE);
        shape.setCornerRadius(50);
        shape.setColor(Color.parseColor("#FF5500"));
        layout.setBackground(shape);

        TextView timerView = new TextView(this);
        timerView.setId(1001);
        timerView.setText("00:00");
        timerView.setTextColor(Color.WHITE);
        timerView.setTextSize(24);
        timerView.setTypeface(null, android.graphics.Typeface.BOLD);
        layout.addView(timerView);

        TextView subjectView = new TextView(this);
        subjectView.setId(1002);
        subjectView.setText("Studying");
        subjectView.setTextColor(Color.WHITE);
        subjectView.setTextSize(12);
        layout.addView(subjectView);

        int layoutFlag;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            layoutFlag = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY;
        } else {
            layoutFlag = WindowManager.LayoutParams.TYPE_PHONE;
        }

        final WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.WRAP_CONTENT,
                layoutFlag,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
                PixelFormat.TRANSLUCENT);

        params.gravity = Gravity.TOP | Gravity.LEFT;
        params.x = 0;
        params.y = 100;

        mWindowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
        mWindowManager.addView(mFloatingWidget, params);

        // Drag and move logic
        mFloatingWidget.setOnTouchListener(new View.OnTouchListener() {
            private int initialX;
            private int initialY;
            private float initialTouchX;
            private float initialTouchY;

            @Override
            public boolean onTouch(View v, MotionEvent event) {
                switch (event.getAction()) {
                    case MotionEvent.ACTION_DOWN:
                        initialX = params.x;
                        initialY = params.y;
                        initialTouchX = event.getRawX();
                        initialTouchY = event.getRawY();
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
