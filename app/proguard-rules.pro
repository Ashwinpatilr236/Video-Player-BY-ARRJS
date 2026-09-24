# Proguard / R8 rules for Video Player by ARRJS

# Media3 / ExoPlayer
-keep class androidx.media3.** { *; }
-dontwarn androidx.media3.**

# Room
-keep class androidx.room.** { *; }
-dontwarn androidx.room.**
-keep class * extends androidx.room.RoomDatabase
-dontwarn androidx.sqlite.db.**

# OkHttp
-keepattributes Signature
-keepattributes *Annotation*
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-dontwarn okhttp3.**
-dontwarn okio.**

# Kotlin Coroutines
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}
-keepclassmembers class kotlinx.coroutines.** {
    volatile <fields>;
}

# Domain & Data Models (JSON / Serialization / Room entities)
-keep class com.arrjs.videoplayer.data.model.** { *; }
-keepclassmembers class com.arrjs.videoplayer.data.model.** { <fields>; }

# Android TV & ViewBinding
-keep class com.arrjs.videoplayer.databinding.** { *; }
-keepclassmembers class * implements androidx.viewbinding.ViewBinding {
    public static *** inflate(...);
    public static *** bind(...);
}
