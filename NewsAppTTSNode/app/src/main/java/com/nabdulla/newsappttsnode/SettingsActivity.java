package com.nabdulla.newsappttsnode;

import android.content.SharedPreferences;
import android.os.Bundle;
import android.text.InputType;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageButton;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

public class SettingsActivity extends AppCompatActivity {
    private EditText editHost, editUsername, editPassword, editExchange, editInputRoutingKey, editOutputRoutingKey;
    private Button btnSave;
    private ImageButton makeVisiblePassword;

    private SharedPreferences prefs;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_settings);

        prefs = getSharedPreferences("RabbitMQPrefs", MODE_PRIVATE);

        editHost = findViewById(R.id.editHost);
        editUsername = findViewById(R.id.editUsername);
        editPassword = findViewById(R.id.editPassword);
        editExchange = findViewById(R.id.editExchange);
        editInputRoutingKey = findViewById(R.id.editInputRoutingKey);
        editOutputRoutingKey = findViewById(R.id.editOutputRoutingKey);
        btnSave = findViewById(R.id.btnSave);
        makeVisiblePassword = findViewById(R.id.makeVisiblePassword);

        // Load existing values
        editHost.setText(prefs.getString("host", "192.168.10.159"));
        editUsername.setText(prefs.getString("username", "news_user"));
        editPassword.setText(prefs.getString("password", "news_password"));
        editExchange.setText(prefs.getString("exchange", "news-app-exchange"));
        editInputRoutingKey.setText(prefs.getString("input_routing_key", "input.tts"));
        editOutputRoutingKey.setText(prefs.getString("output_routing_key", "output.tts"));

        btnSave.setOnClickListener(v -> {
            SharedPreferences.Editor editor = prefs.edit();
            editor.putString("host", editHost.getText().toString());
            editor.putString("username", editUsername.getText().toString());
            editor.putString("password", editPassword.getText().toString());
            editor.putString("exchange", editExchange.getText().toString());
            editor.putString("input_routing_key", editInputRoutingKey.getText().toString());
            editor.putString("output_routing_key", editOutputRoutingKey.getText().toString());
            editor.apply();

            Toast.makeText(this, "Saved!", Toast.LENGTH_SHORT).show();
            finish(); // go back to previous screen
        });

        makeVisiblePassword.setOnClickListener(v -> {
            int passwordVisibleText = InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD;
            int passwordText = InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PASSWORD;
            if (editPassword.getInputType() == passwordText) {
                editPassword.setInputType(passwordVisibleText);
            } else {
                editPassword.setInputType(passwordText);
            }
        });
    }
}
