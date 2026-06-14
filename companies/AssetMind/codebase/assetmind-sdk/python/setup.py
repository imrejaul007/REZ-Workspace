"""
AssetMind SDK - Python Package
"""

from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="assetmind",
    version="1.0.0",
    author="AssetMind",
    author_email="sdk@assetmind.ai",
    description="Python SDK for AssetMind Financial Intelligence Platform",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/assetmind/sdk-python",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "Intended Audience :: Financial and Insurance Industry",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Topic :: Office/Business :: Financial :: Investment",
    ],
    python_requires=">=3.9",
    install_requires=[
        "httpx>=0.25.0",
        "pydantic>=2.0.0",
    ],
    extras_require={
        "dev": [
            "pytest>=7.0.0",
            "pytest-asyncio>=0.21.0",
            "pytest-cov>=4.0.0",
            "black>=23.0.0",
            "mypy>=1.0.0",
        ],
        "async": [
            "httpx[http2]>=0.25.0",
        ],
    },
    keywords=["finance", "investment", "portfolio", "ai", "trading", "asset-management"],
    project_urls={
        "Bug Reports": "https://github.com/assetmind/sdk-python/issues",
        "Documentation": "https://docs.assetmind.ai",
        "Source": "https://github.com/assetmind/sdk-python",
    },
)
