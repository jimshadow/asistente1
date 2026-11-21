require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "NitroPoseExercises"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = "https://github.com/"
  s.license      = package["license"]
  s.authors      = "NitroPoseExercises"

  s.platforms    = { :ios => min_ios_version_supported }
  s.source       = { :git => "", :tag => "#{s.version}" }

  s.source_files = ["ios/**/*.{swift}", "ios/**/*.{m,mm}"]
  s.frameworks   = ["Vision", "AVFoundation"]

  load 'nitrogen/generated/ios/NitroPoseExercises+autolinking.rb'
  add_nitrogen_files(s)

  s.dependency 'VisionCamera'
  s.dependency 'React-jsi'
  s.dependency 'React-callinvoker'
  install_modules_dependencies(s)
end
