"""API serializers for identity module."""

from rest_framework import serializers


class TeacherSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    name = serializers.CharField(max_length=255)
    email = serializers.EmailField(read_only=True)
    user_id = serializers.UUIDField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)


class TeacherCreateSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    name = serializers.CharField(max_length=255)


class AdminSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    name = serializers.CharField(max_length=255)
    email = serializers.EmailField(read_only=True)
    user_id = serializers.UUIDField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
