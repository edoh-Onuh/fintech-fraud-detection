"""
Simple script to start the Fraud Detection API
"""
import uvicorn

if __name__ == "__main__":
    print("Starting Fraud Detection API...")
    print("API will be available at: http://localhost:8000")
    print("Swagger docs at: http://localhost:8000/docs")
    print("Press CTRL+C to stop")
    
    uvicorn.run(
        "src.api.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
