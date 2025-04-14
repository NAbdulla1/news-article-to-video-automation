package com.nabdulla.newsappttsnode;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class StopServiceReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        Intent stopIntent = new Intent(context, RabbitMqService.class);
        context.stopService(stopIntent);
    }
}
