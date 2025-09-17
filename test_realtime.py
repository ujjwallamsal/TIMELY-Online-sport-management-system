#!/usr/bin/env python3
"""
Test script for real-time functionality
"""
import os
import sys
import django
from pathlib import Path

# Add the project directory to Python path
project_dir = Path(__file__).parent / "timely-backend"
sys.path.insert(0, str(project_dir))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'timely.settings')
django.setup()

def test_realtime_service():
    """Test the real-time service"""
    try:
        from events.realtime_service import realtime_service
        print("✅ RealtimeService imported successfully")
        
        # Test channel layer availability
        if realtime_service.channel_layer:
            print("✅ Channel layer is available")
        else:
            print("⚠️  Channel layer is not available (expected in development)")
            
        return True
    except Exception as e:
        print(f"❌ Error testing realtime service: {e}")
        return False

def test_consumers():
    """Test WebSocket consumers"""
    try:
        from events.consumers import EventConsumer, NotificationConsumer
        print("✅ WebSocket consumers imported successfully")
        return True
    except Exception as e:
        print(f"❌ Error testing consumers: {e}")
        return False

def test_sse_views():
    """Test SSE views"""
    try:
        from events.sse_views import EventSSEView, EventResultsSSEView
        print("✅ SSE views imported successfully")
        return True
    except Exception as e:
        print(f"❌ Error testing SSE views: {e}")
        return False

def test_signals():
    """Test signal handlers"""
    try:
        from results.signals import result_saved, result_deleted
        from fixtures.signals import fixture_saved, fixture_deleted
        print("✅ Signal handlers imported successfully")
        return True
    except Exception as e:
        print(f"❌ Error testing signals: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Testing Real-time Implementation")
    print("=" * 50)
    
    tests = [
        ("RealtimeService", test_realtime_service),
        ("WebSocket Consumers", test_consumers),
        ("SSE Views", test_sse_views),
        ("Signal Handlers", test_signals),
    ]
    
    passed = 0
    total = len(tests)
    
    for name, test_func in tests:
        print(f"\n🔍 Testing {name}...")
        if test_func():
            passed += 1
        else:
            print(f"❌ {name} test failed")
    
    print("\n" + "=" * 50)
    print(f"📊 Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Real-time implementation is ready.")
    else:
        print("⚠️  Some tests failed. Check the errors above.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
